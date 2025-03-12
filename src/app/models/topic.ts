import { Post } from './post';

export interface Topic {
  id: string;
  userId: string;
  ownerUsername: string;
  name: string;
  posts: Post[];
}

export type Topics = Topic[];
