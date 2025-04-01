export interface Post {
  id: string;
  name: string;
  description?: string;
  photoUrl?: string | null;
}

export type Posts = Post[];
