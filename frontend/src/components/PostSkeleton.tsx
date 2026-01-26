import "./PostSkeleton.css";

const PostSkeleton = () => {
  return (
    <div className="post-skeleton">
      <div className="post-skeleton__line short" />
      <div className="post-skeleton__line" />
      <div className="post-skeleton__line long" />
    </div>
  );
};

export default PostSkeleton;
