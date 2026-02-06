import { useState } from "react";
import { createPost } from "../api/post.api";

const CreatePost = ({ onPost }: { onPost: () => void }) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const submitPost = async () => {
    if (!content.trim()) return;

    try {
      setLoading(true);
      await createPost(content);
      setContent("");
      onPost();
    } catch (err) {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <textarea
        placeholder="Start a post..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={styles.textarea}
      />

      <div style={styles.actions}>
        <button onClick={submitPost} disabled={loading}>
          {loading ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
};

const styles = {
  card: {
    background: "#fff",
    padding: "16px",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  textarea: {
    width: "100%",
    border: "none",
    outline: "none",
    resize: "none" as const,
    fontSize: "14px",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
  },
};

export default CreatePost;
