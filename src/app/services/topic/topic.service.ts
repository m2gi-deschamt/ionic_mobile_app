import { inject, Injectable } from '@angular/core';
import { Topic, Topics } from '../../models/topic';
import { Post } from '../../models/post';
import { generateUUID } from '../../utils/generate-uuid';
import { Observable, map, of, switchMap, firstValueFrom, combineLatest } from 'rxjs';
import { Firestore, collection, collectionData, doc, docData, setDoc, updateDoc, deleteDoc, addDoc, query, where, getDoc, getDocs, writeBatch } from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';
import { User } from 'src/app/models/user';


@Injectable({
  providedIn: 'root',
})
export class TopicService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  topicsCollection = collection(this.firestore, 'topics');

  private getCurrentUserId(): Observable<string | null> {
    return this.authService.getConnectedAuth().pipe(
      map(user => user ? user.uid : null)
    );
  }

  getAll(): Observable<Topics> {
    return this.getCurrentUserId().pipe(
      switchMap(userId => {
        if (!userId) return of([]);
        
        // Query pour récupérer les topics dont l'utilisateur est propriétaire
        const userTopicsQuery = query(
          this.topicsCollection, 
          where('userId', '==', userId)
        );
        
        // Faire deux requêtes distinctes pour les rôles reader et editor
        // Et filtrer en mémoire pour vérifier que l'userId correspond
        const sharedTopics$ = collectionData(this.topicsCollection).pipe(
          map((topics: any[]) => topics.filter(topic => 
            topic.sharedWith?.some((share: any) => 
              share.userId === userId && 
              (share.role === 'reader' || share.role === 'editor')
            )
          ))
        ) as Observable<Topic[]>;
        
        // Combiner les deux résultats
        const ownedTopics$ = collectionData(userTopicsQuery, { idField: 'id' }) as Observable<Topic[]>;
        
        return combineLatest([ownedTopics$, sharedTopics$]).pipe(
          map(([ownedTopics, sharedTopics]) => {
            // Dédupliquer au cas où
            const allTopics = [...ownedTopics, ...sharedTopics];
            const uniqueTopics: Topic[] = [];
            const seenIds = new Set<string>();
            
            allTopics.forEach(topic => {
              if (!seenIds.has(topic.id)) {
                seenIds.add(topic.id);
                uniqueTopics.push(topic);
              }
            });
            
            return uniqueTopics;
          })
        );
      })
    );
  }
  getById(topicId: string): Observable<Topic | undefined> {
    const topicDoc = doc(this.firestore, `topics/${topicId}`);
    return this.getCurrentUserId().pipe(
      switchMap(userId => {
        if (!userId) return of(undefined);
        
        return docData(topicDoc, { idField: 'id' }).pipe(
          map((topic: any) => {
            if (!topic) return undefined;
            
            // Si l'utilisateur est propriétaire, autoriser l'accès
            if (topic.userId === userId) return topic;
            
            // Si le topic est partagé avec l'utilisateur, autoriser l'accès
            const sharedWith = topic.sharedWith || [];
            const userSharing = sharedWith.find((s: { userId: string; }) => s.userId === userId);
            
            return userSharing ? topic : undefined;
          })
        );
      })
    );
  }

  getPostsByTopicId(topicId: string): Observable<Post[]> {
    return this.getById(topicId).pipe(
      switchMap(topic => {
        if (!topic) return of([]);
        
        const postsCollection = collection(this.firestore, `topics/${topicId}/posts`);
        return collectionData(postsCollection, { idField: 'id' }) as Observable<Post[]>;
      })
    );
  }

  

  async addTopic(topic: Omit<Topic, 'id' | 'posts' | 'userId' | 'ownerUsername'>): Promise<void> {
    const user = this.authService.isConnected();
    if (!user?.uid) throw new Error('User not authenticated');
    
    const userDoc = doc(this.firestore, `users/${user.uid}`);
    const userSnap = await getDoc(userDoc);
    const userData = userSnap.data() as User;
    
    const id = generateUUID();
    const _topic: Topic = {
      ...topic,
      id,
      userId: user.uid,
      ownerUsername: userData.username || 'Unknown user',
      posts: [],
    };
    
    const topicDoc = doc(this.firestore, `topics/${id}`);
    await setDoc(topicDoc, _topic);
  }

  async editTopic(topic: Topic): Promise<void> {
    const userId = this.authService.isConnected()?.uid;
    if (!userId) throw new Error('User not authenticated');
    
    const topicDoc = doc(this.firestore, `topics/${topic.id}`);
    const topicSnapshot = await firstValueFrom(docData(topicDoc, { idField: 'id' }).pipe(
      map((t: any) => t as Topic | undefined)
    ));
    
    if (!topicSnapshot) {
      throw new Error('Topic not found');
    }
    
    // Vérification des permissions d'édition
    const userRole = this.getUserRole(topicSnapshot);
    if (userRole !== 'owner' && userRole !== 'editor') {
      throw new Error('Insufficient permissions to edit topic');
    }
    
    await updateDoc(topicDoc, { name: topic.name });
  }

  async removeTopic(topic: Topic): Promise<void> {
    const userId = this.authService.isConnected()?.uid;
    if (!userId) throw new Error('User not authenticated');
    
    const topicDoc = doc(this.firestore, `topics/${topic.id}`);
    const topicSnapshot = await firstValueFrom(docData(topicDoc, { idField: 'id' }).pipe(
      map((t: any) => t as Topic | undefined)
    ));
    
    if (!topicSnapshot) {
      throw new Error('Topic not found');
    }
    
    // Vérification des permissions de suppression
    const userRole = this.getUserRole(topicSnapshot);
    if (userRole !== 'owner' && userRole !== 'editor') {
      throw new Error('Insufficient permissions to delete topic');
    }
    
    // Récupérer et supprimer tous les posts associés
    const postsCollection = collection(this.firestore, `topics/${topic.id}/posts`);
    const postsSnapshot = await getDocs(postsCollection);
    
    // Supprimer d'abord tous les posts
    if (!postsSnapshot.empty) {
      const batch = writeBatch(this.firestore);
      postsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
    
    // Puis supprimer le topic
    await deleteDoc(topicDoc);
  }

  async addPost(topicId: string, post: Omit<Post, 'id'>): Promise<void> {
    const userId = this.authService.isConnected()?.uid;
    if (!userId) throw new Error('User not authenticated');
    
    const topicDoc = doc(this.firestore, `topics/${topicId}`);
    const topicSnapshot = await firstValueFrom(docData(topicDoc, { idField: 'id' }).pipe(
      map((t: any) => t as Topic | undefined)
    ));
    
    if (!topicSnapshot) {
      throw new Error('Topic not found');
    }
    
    // Vérification des permissions d'édition
    const userRole = this.getUserRole(topicSnapshot);
    if (userRole !== 'owner' && userRole !== 'editor') {
      throw new Error('Insufficient permissions to add posts');
    }
    
    const postsCollection = collection(this.firestore, `topics/${topicId}/posts`);
    const id = generateUUID();
    const newPost: Post = { 
      id, 
      name: post.name, 
      description: post.description 
    };
    
    await setDoc(doc(postsCollection, id), newPost);
  }
  
  async editPost(topicId: string, post: Post): Promise<void> {
    const userId = this.authService.isConnected()?.uid;
    if (!userId) throw new Error('User not authenticated');
    
    const topicDoc = doc(this.firestore, `topics/${topicId}`);
    const topicSnapshot = await firstValueFrom(docData(topicDoc, { idField: 'id' }).pipe(
      map((t: any) => t as Topic | undefined)
    ));
    
    if (!topicSnapshot) {
      throw new Error('Topic not found');
    }
    
    // Vérification des permissions d'édition
    const userRole = this.getUserRole(topicSnapshot);
    if (userRole !== 'owner' && userRole !== 'editor') {
      throw new Error('Insufficient permissions to edit posts');
    }
    
    const postDoc = doc(this.firestore, `topics/${topicId}/posts/${post.id}`);
    const postData = {
      name: post.name,
      description: post.description || ''
    };
    await updateDoc(postDoc, postData);
  }
  
  async removePost(topicId: string, post: Post): Promise<void> {
    const userId = this.authService.isConnected()?.uid;
    if (!userId) throw new Error('User not authenticated');
    
    const topicDoc = doc(this.firestore, `topics/${topicId}`);
    const topicSnapshot = await firstValueFrom(docData(topicDoc, { idField: 'id' }).pipe(
      map((t: any) => t as Topic | undefined)
    ));
    
    if (!topicSnapshot) {
      throw new Error('Topic not found');
    }
    
    // Vérification des permissions d'édition
    const userRole = this.getUserRole(topicSnapshot);
    if (userRole !== 'owner' && userRole !== 'editor') {
      throw new Error('Insufficient permissions to remove posts');
    }
    
    const postDoc = doc(this.firestore, `topics/${topicId}/posts/${post.id}`);
    await deleteDoc(postDoc);
  }
  // Add these methods to your TopicService class

  async addUserToTopicSharing(topicId: string, username: string, role: 'reader' | 'editor'): Promise<void> {
    const userId = this.authService.isConnected()?.uid;
    if (!userId) throw new Error('User not authenticated');
    
    // Vérifier que le topic appartient à l'utilisateur courant
    const topicDoc = doc(this.firestore, `topics/${topicId}`);
    const topicSnapshot = await firstValueFrom(docData(topicDoc, { idField: 'id' }).pipe(
      map((t: any) => t as Topic | undefined)
    ));
    
    if (!topicSnapshot) {
      throw new Error('Topic not found');
    }
    
    // Seul le propriétaire peut partager un topic
    if (topicSnapshot.userId !== userId) {
      throw new Error('Only the topic owner can share it');
    }
    
    // Rechercher l'utilisateur par username
    const usersCollection = collection(this.firestore, 'users');
    const userQuery = query(usersCollection, where('username', '==', username));
    const userDocs = await getDocs(userQuery);
    
    if (userDocs.empty) {
      throw new Error('User not found');
    }
    
    const userData = userDocs.docs[0].data() as User;
    const targetUserId = userDocs.docs[0].id;
    
    // Mettre à jour le tableau de partage
    const sharedWith = topicSnapshot.sharedWith || [];
    
    const existingSharing = sharedWith.find(s => s.userId === targetUserId);
    if (existingSharing) {
      existingSharing.role = role;
    } else {
      sharedWith.push({
        userId: targetUserId,
        username: userData.username || username,
        role: role
      });
    }
    
    await updateDoc(topicDoc, { sharedWith });
  }

async removeUserFromTopicSharing(topicId: string, targetUserId: string): Promise<void> {
  const userId = this.authService.isConnected()?.uid;
  if (!userId) throw new Error('User not authenticated');
  
  // Check if topic belongs to current user
  const topicDoc = doc(this.firestore, `topics/${topicId}`);
  const topicSnapshot = await firstValueFrom(docData(topicDoc, { idField: 'id' }).pipe(
    map((t: any) => t as Topic | undefined)
  ));
  
  if (!topicSnapshot || topicSnapshot.userId !== userId) {
    throw new Error('Unauthorized access to topic');
  }
  
  // Remove user from sharedWith array
  const sharedWith = (topicSnapshot.sharedWith || [])
    .filter(s => s.userId !== targetUserId);
  
  // Update the topic document
  await updateDoc(topicDoc, { sharedWith });
}

hasEditPermission(topic: Topic): boolean {
  const userId = this.authService.isConnected()?.uid;
  if (!userId) return false;
  
  // Propriétaire du topic
  if (topic.userId === userId) return true;
  
  // Vérification des droits partagés
  const sharedWith = topic.sharedWith || [];
  const userSharing = sharedWith.find(s => s.userId === userId);
  
  // Seul un éditeur peut modifier le topic
  return userSharing?.role === 'editor';
}

/**
 * Vérifie si l'utilisateur est propriétaire du topic
 */
isOwner(topic: Topic): boolean {
  const userId = this.authService.isConnected()?.uid;
  return userId ? topic.userId === userId : false;
}

/**
 * Récupère le rôle de l'utilisateur pour ce topic
 */
getUserRole(topic: Topic): 'owner' | 'editor' | 'reader' | undefined {
  const userId = this.authService.isConnected()?.uid;
  if (!userId) return undefined;
  
  // Propriétaire
  if (topic.userId === userId) return 'owner';
  
  // Rôle partagé
  const sharedWith = topic.sharedWith || [];
  const userSharing = sharedWith.find(s => s.userId === userId);
  
  return userSharing?.role;
}
}