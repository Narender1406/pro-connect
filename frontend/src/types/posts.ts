export interface Comment {
  _id: string;
  user: {
    _id: string;
    name: string;
    profilePic?: string;
  };
  text: string;
  createdAt: string;
}

export interface Post {
  _id: string;
  author: {
    _id: string;
    name: string;
    profilePic?: string;
  };
  content: string;
  media?: any[];
  likes: string[];
  comments: Comment[];
  shares: number;
  createdAt: string;
}
