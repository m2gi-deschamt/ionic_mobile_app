import { Post } from './post';

export interface TopicSharing {
  userId: string;
  username: string;
  role: 'reader' | 'editor';
}

export interface Topic {
  id: string;
  userId: string;
  ownerUsername: string;
  name: string;
  posts: Post[];
  sharedWith?: TopicSharing[];
}

export type Topics = Topic[];