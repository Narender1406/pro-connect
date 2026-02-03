import { useEffect, useState } from "react";
import "./Feed.css";
import { getFeed, createPost } from "../api/post.api";

interface Post {
  _id: string;
  content: string;
  author?: {
    name?: string;
  };
  createdAt: string;
}

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadFeed = async () => {
    try {
      setLoading(true);
      const res = await getFeed();
      setPosts(res || []);
    } catch (err) {
      setError("Unable to load feed. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!content.trim()) return;

    try {
      await createPost({ content });
      setContent("");
      loadFeed();
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  return (
    <div className="feed-container">
      {/* Post Composer */}
      <div className="composer">
        <h3>Share a career update</h3>

        <textarea
          placeholder="Share an achievement, project update, or insight..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {error && <p className="error">{error}</p>}

        <div className="composer-footer">
          <span>Keep it professional & helpful</span>
          <button onClick={handlePost}>Post</button>
        </div>
      </div>

      {/* Feed Content */}
      {loading && <p className="status">Loading feed...</p>}

      {!loading && posts.length === 0 && (
        <p className="status">No posts yet. Be the first to share!</p>
      )}

      <div className="posts">
        {posts.map((post) => (
          <div className="post-card" key={post._id}>
            <div className="post-header">
              <strong>{post.author?.name || "Anonymous"}</strong>
              <span>
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>

            <p className="post-content">{post.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
