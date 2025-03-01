import { inject, Injectable } from '@angular/core';
import { Topic, Topics } from '../../models/topic';
import { Post } from '../../models/post';
import { generateUUID } from '../../utils/generate-uuid';
import { Observable, map, of, switchMap, firstValueFrom } from 'rxjs';
import { Firestore, collection, collectionData, doc, docData, setDoc, updateDoc, deleteDoc, addDoc, query, where } from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';

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
        
        const userTopicsQuery = query(
          this.topicsCollection, 
          where('userId', '==', userId)
        );
        
        return collectionData(userTopicsQuery, { idField: 'id' }) as Observable<Topic[]>;
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
            return topic && topic.userId === userId ? topic : undefined;
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

  async addTopic(topic: Omit<Topic, 'id' | 'posts' | 'userId'>): Promise<void> {
    const userId = this.authService.isConnected()?.uid;
    if (!userId) throw new Error('User not authenticated');
    
    const id = generateUUID();
    const _topic: Topic = {
      ...topic,
      id,
      userId,
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
    
    if (!topicSnapshot || topicSnapshot.userId !== userId) {
      throw new Error('Unauthorized access to topic');
    }
    
    await updateDoc(topicDoc, { name: topic.name });
  }

  async removeTopic(topic: Topic): Promise<void> {
    const userId = this.authService.isConnected()?.uid;
    if (!userId) throw new Error('User not authenticated');
    
    if (topic.userId !== userId) {
      throw new Error('Unauthorized access to topic');
    }
    
    const topicDoc = doc(this.firestore, `topics/${topic.id}`);
    await deleteDoc(topicDoc);
  }

  async addPost(topicId: string, post: Omit<Post, 'id'>): Promise<void> {
    const userId = this.authService.isConnected()?.uid;
    if (!userId) throw new Error('User not authenticated');
    
    const topicDoc = doc(this.firestore, `topics/${topicId}`);
    const topicSnapshot = await firstValueFrom(docData(topicDoc, { idField: 'id' }).pipe(
      map((t: any) => t as Topic | undefined)
    ));
    
    if (!topicSnapshot || topicSnapshot.userId !== userId) {
      throw new Error('Unauthorized access to topic');
    }
    
    const postsCollection = collection(this.firestore, `topics/${topicId}/posts`);
    const newPost: Post = { ...post, id: generateUUID() };
    await addDoc(postsCollection, newPost);
  }
 
  async editPost(topicId: string, post: Post): Promise<void> {
    const userId = this.authService.isConnected()?.uid;
    if (!userId) throw new Error('User not authenticated');
    
    const topicDoc = doc(this.firestore, `topics/${topicId}`);
    const topicSnapshot = await firstValueFrom(docData(topicDoc, { idField: 'id' }).pipe(
      map((t: any) => t as Topic | undefined)
    ));
    
    if (!topicSnapshot || topicSnapshot.userId !== userId) {
      throw new Error('Unauthorized access to topic');
    }
    
    const postDoc = doc(this.firestore, `topics/${topicId}/posts/${post.id}`);
    await updateDoc(postDoc, { ...post });
  }

  async removePost(topicId: string, post: Post): Promise<void> {
    const userId = this.authService.isConnected()?.uid;
    if (!userId) throw new Error('User not authenticated');
    
    const topicDoc = doc(this.firestore, `topics/${topicId}`);
    const topicSnapshot = await firstValueFrom(docData(topicDoc, { idField: 'id' }).pipe(
      map((t: any) => t as Topic | undefined)
    ));
    
    if (!topicSnapshot || topicSnapshot.userId !== userId) {
      throw new Error('Unauthorized access to topic');
    }
    
    const postDoc = doc(this.firestore, `topics/${topicId}/posts/${post.id}`);
    await deleteDoc(postDoc);
  }
}