export interface Post {
  _id: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  image?: string;
  likes: string[];
  comments: number;
  createdAt: string;
}
