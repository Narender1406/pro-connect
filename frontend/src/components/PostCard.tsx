import { Post } from "../types/posts";

const PostCard = ({ post }: any) => {
  return (
    <div style={styles.card}>
      <h4 style={styles.author}>{post.author?.name || "User"}</h4>
      <p style={styles.content}>{post.content}</p>
      <span style={styles.date}>
        {new Date(post.createdAt).toLocaleString()}
      </span>
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
  author: {
    marginBottom: "8px",
    fontWeight: 600,
  },
  content: {
    marginBottom: "10px",
  },
  date: {
    fontSize: "12px",
    color: "#666",
  },
};

export default PostCard;
