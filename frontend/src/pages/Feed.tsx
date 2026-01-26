import { useEffect, useState } from "react";
import CreatePost from "../components/CreatePost";
import PostList from "../components/PostList";
import PostSkeleton from "../components/PostSkeleton";
import { fetchPosts } from "../api/post.api";
import { useAuth } from "../context/AuthContext";
import { Post } from "../types/posts";

const Feed = () => {
  const { token } = useAuth();
  

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPosts = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const data = await fetchPosts(token);
        setPosts(data);
      } catch (err) {
        console.error("Feed load error:", err);
        setError("Unable to load feed. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [token]);

  const handlePostCreated = (post: Post) => {
    setPosts((prev) => [post, ...prev]);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <CreatePost onPostCreated={handlePostCreated} />

      {loading && (
        <div className="space-y-4">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}

      {!loading && error && (
        <p className="text-center text-sm text-red-500 mt-6">
          {error}
        </p>
      )}

      {!loading && !error && <PostList posts={posts} />}
    </div>
  );
};

export default Feed;
