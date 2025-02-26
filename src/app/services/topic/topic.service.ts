import { inject, Injectable } from '@angular/core';
import { Topic, Topics } from '../../models/topic';
import { Post } from '../../models/post';
import { generateUUID } from '../../utils/generate-uuid';
import { Observable } from 'rxjs';
import { Firestore, collection, collectionData, doc, docData, setDoc, updateDoc, deleteDoc, addDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class TopicService {
  private firestore = inject(Firestore);

  topicsCollection = collection(this.firestore, 'topics');

  getAll(): Observable<Topics> {
    return collectionData(this.topicsCollection, { idField: 'id' }) as Observable<Topic[]>;
  }

  getById(topicId: string): Observable<Topic | undefined> {
    const topicDoc = doc(this.firestore, `topics/${topicId}`);
    return docData(topicDoc, { idField: 'id' }) as Observable<Topic | undefined>;
  }

  getPostsByTopicId(topicId: string): Observable<Post[]> {
    const postsCollection = collection(this.firestore, `topics/${topicId}/posts`);
    return collectionData(postsCollection, { idField: 'id' }) as Observable<Post[]>;
  }

  async addTopic(topic: Omit<Topic, 'id' | 'posts'>): Promise<void> {
    const id = generateUUID();
    const _topic: Topic = {
      ...topic,
      id,
      posts: [],
    };
    const topicDoc = doc(this.firestore, `topics/${id}`);
    await setDoc(topicDoc, _topic);
  }

  async editTopic(topic: Topic): Promise<void> {
    const topicDoc = doc(this.firestore, `topics/${topic.id}`);
    await updateDoc(topicDoc, { name: topic.name });
  }

  async removeTopic(topic: Topic): Promise<void> {
    const topicDoc = doc(this.firestore, `topics/${topic.id}`);
    await deleteDoc(topicDoc);
  }

  async addPost(topicId: string, post: Omit<Post, 'id'>): Promise<void> {
    const postsCollection = collection(this.firestore, `topics/${topicId}/posts`);
    const newPost: Post = { ...post, id: generateUUID() };
    await addDoc(postsCollection, newPost);
}
 
async editPost(topicId: string, post: Post): Promise<void> {
  const postDoc = doc(this.firestore, `topics/${topicId}/posts/${post.id}`);
  await updateDoc(postDoc, { ...post });
}

async removePost(topicId: string, post: Post): Promise<void> {
  const postDoc = doc(this.firestore, `topics/${topicId}/posts/${post.id}`);
  await deleteDoc(postDoc);
}
}