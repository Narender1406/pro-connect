import { useEffect, useState } from "react";
import { getFeed } from "../api/post.api";
import { Post } from "../types/posts";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";
import { showToast } from "../utils/toast";

const Feed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      const data = await getFeed();
      setPosts(data.posts || []);
    } catch (err) {
      console.error("Feed error", err);
      showToast.error("Failed to load feed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.feed}>
        <CreatePost onPost={loadFeed} />

        {loading ? (
          <p style={styles.loading}>Loading feed...</p>
        ) : posts.length === 0 ? (
          <p style={styles.empty}>No posts yet. Be the first to post!</p>
        ) : (
          posts.map((post) => (
            <PostCard key={post._id} post={post} onUpdate={loadFeed} />
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    padding: "30px 20px",
    minHeight: "calc(100vh - 70px)",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  },
  feed: {
    width: "100%",
    maxWidth: "600px",
  },
  loading: {
    textAlign: "center" as const,
    color: "#94a3b8",
    fontSize: "1rem",
    padding: "2rem",
  },
  empty: {
    textAlign: "center" as const,
    color: "#94a3b8",
    fontSize: "1rem",
    padding: "2rem",
    background: "linear-gradient(135deg, #1e293b, #0f172a)",
    borderRadius: "12px",
    border: "1px solid #334155",
  },
};

// Add media query styles
if (typeof window !== 'undefined') {
  const mediaQuery768 = window.matchMedia('(max-width: 768px)');
  const mediaQuery480 = window.matchMedia('(max-width: 480px)');
  
  if (mediaQuery768.matches) {
    styles.container.padding = "20px 10px";
  }
  
  if (mediaQuery480.matches) {
    styles.container.padding = "15px 8px";
  }
}

export default Feed;
