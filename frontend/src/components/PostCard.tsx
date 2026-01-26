import { Post } from "../types/posts";

const PostCard = ({ post }: { post: Post }) => {
  return (
    <div className="bg-card p-4 rounded-xl shadow-sm">
      <p className="text-sm whitespace-pre-wrap">{post.content}</p>

      <div className="text-xs text-muted mt-2">
        {new Date(post.createdAt).toLocaleString()}
      </div>
    </div>
  );
};

export default PostCard;
