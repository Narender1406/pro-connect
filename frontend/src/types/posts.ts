export interface Post {
  _id: string;
  content: string;
  author: {
    _id: string;
    name?: string;
  };
  createdAt: string;
}
