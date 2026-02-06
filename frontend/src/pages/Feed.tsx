import { useEffect, useState } from "react";
import { getFeed } from "../api/post.api";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";

const Feed = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      const data = await getFeed();
      setPosts(data);
    } catch (err) {
      console.error("Feed error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.feed}>
        <CreatePost onPost={loadFeed} />

        {loading ? (
          <p>Loading feed...</p>
        ) : (
          posts.map((post) => (
            <PostCard key={post._id} post={post} />
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
  },
  feed: {
    width: "100%",
    maxWidth: "600px",
  },
};

export default Feed;
