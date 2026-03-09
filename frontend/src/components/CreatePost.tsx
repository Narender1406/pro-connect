import { useState, useRef } from "react";
import { createPost } from "../api/post.api";
import { showToast } from "../utils/toast";
import { useAuth } from "../context/AuthContext";

const CreatePost = ({ onPost }: { onPost: () => void }) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<{ type: string; url: string; file?: File }[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (type === 'image' && !file.type.startsWith('image/')) {
        showToast.error('Please select an image file');
        return;
      }
      if (type === 'video' && !file.type.startsWith('video/')) {
        showToast.error('Please select a video file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setMedia(prev => [...prev, { 
          type, 
          url: e.target?.result as string,
          file 
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const submitPost = async () => {
    if (!content.trim() && media.length === 0) {
      showToast.error("Please write something or add media");
      return;
    }

    try {
      setLoading(true);
      await createPost(content, media.map(m => ({ type: m.type, url: m.url })));
      setContent("");
      setMedia([]);
      showToast.success("Post created successfully");
      onPost();
    } catch (err) {
      showToast.error("Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.avatar}>
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <textarea
          placeholder="Start a post..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={styles.textarea}
          rows={3}
        />
      </div>

      {media.length > 0 && (
        <div style={styles.mediaPreview}>
          {media.map((item, index) => (
            <div key={index} style={styles.mediaItem}>
              {item.type === 'image' ? (
                <img src={item.url} alt="Preview" style={styles.previewImage} />
              ) : (
                <video src={item.url} style={styles.previewVideo} controls />
              )}
              <button 
                onClick={() => removeMedia(index)} 
                style={styles.removeBtn}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={styles.actions}>
        <div style={styles.mediaButtons}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e, 'image')}
          />
          <button 
            style={styles.mediaBtn}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            Photo
          </button>
          <button style={styles.mediaBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            Video
          </button>
        </div>
        <button 
          onClick={submitPost} 
          disabled={loading || (!content.trim() && media.length === 0)}
          style={{
            ...styles.postBtn,
            opacity: loading || (!content.trim() && media.length === 0) ? 0.5 : 1,
            cursor: loading || (!content.trim() && media.length === 0) ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
};

const styles = {
  card: {
    background: "linear-gradient(135deg, #1e293b, #0f172a)",
    border: "1px solid #334155",
    padding: "1.5rem",
    borderRadius: "12px",
    marginBottom: "1rem",
  },
  header: {
    display: "flex",
    gap: "12px",
    marginBottom: "1rem",
  },
  avatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    fontSize: "1.25rem",
    flexShrink: 0,
  },
  textarea: {
    flex: 1,
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "0.75rem",
    color: "#f1f5f9",
    fontSize: "0.9375rem",
    resize: "none" as const,
    outline: "none",
    fontFamily: "inherit",
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mediaButtons: {
    display: "flex",
    gap: "0.5rem",
  },
  mediaBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    background: "transparent",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#94a3b8",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  } as React.CSSProperties,
  postBtn: {
    padding: "0.625rem 1.5rem",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontSize: "0.9375rem",
    fontWeight: 600,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  } as React.CSSProperties,
  mediaPreview: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  mediaItem: {
    position: "relative" as const,
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #334155",
  },
  previewImage: {
    width: "100%",
    height: "150px",
    objectFit: "cover" as const,
  },
  previewVideo: {
    width: "100%",
    height: "150px",
    objectFit: "cover" as const,
  },
  removeBtn: {
    position: "absolute" as const,
    top: "4px",
    right: "4px",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "rgba(0, 0, 0, 0.7)",
    color: "white",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

export default CreatePost;
