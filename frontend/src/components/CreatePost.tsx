import { useState } from "react";
import { createPost } from "../api/post.api";
import { useAuth } from "../context/AuthContext";
import { Post } from "../types/posts";
import "./CreatePost.css";

interface CreatePostProps {
  onPostCreated: (post: Post) => void;
}

const CreatePost = ({ onPostCreated }: CreatePostProps) => {
  const { token } = useAuth();
 

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePost = async () => {
    if (!content.trim()) return;

    if (!token) {
      setError("You must be logged in to post.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const newPost = await createPost(content.trim(), token);

      onPostCreated(newPost);
      setContent("");
    } catch (err) {
      console.error("Create post failed:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post">
      <h3 className="create-post__title">
        Share a career update
      </h3>

      <textarea
        className="create-post__input"
        placeholder="What did you learn, build, or apply for today?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={loading}
      />

      {error && (
        <p className="create-post__error">{error}</p>
      )}

      <div className="create-post__footer">
        <span className="create-post__hint">
          Keep it professional & helpful
        </span>

        <button
          className="create-post__button"
          onClick={handlePost}
          disabled={loading || !content.trim()}
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
};

export default CreatePost;
