import { Post } from "../types/posts";
import PostCard from "./PostCard";
import FeedEmpty from "./FeedEmpty";

interface Props {
  posts: Post[];
}

const PostList = ({ posts }: Props) => {
  if (posts.length === 0) {
    return <FeedEmpty />;
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
};

export default PostList;
