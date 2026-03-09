import { useState } from "react";
import { Post } from "../types/posts";
import { postAPI } from "../api/post.api";
import { showToast } from "../utils/toast";
import { useAuth } from "../context/AuthContext";

const PostCard = ({ post, onUpdate }: { post: Post; onUpdate: () => void }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isLiked, setIsLiked] = useState(post.likes.includes(user?.id || ""));
  const [likeCount, setLikeCount] = useState(post.likes.length);
  const [commentCount, setCommentCount] = useState(post.comments.length);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLike = async () => {
    try {
      await postAPI.toggleLike(post._id);
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    } catch (error) {
      showToast.error("Failed to like post");
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setIsSubmitting(true);
      await postAPI.addComment(post._id, commentText);
      setCommentText("");
      setCommentCount(commentCount + 1);
      showToast.success("Comment added");
      onUpdate();
    } catch (error) {
      showToast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = (platform: string) => {
    const postUrl = `${window.location.origin}/posts/${post._id}`;
    const text = `Check out this post: ${post.content.substring(0, 100)}...`;
    
    let shareUrl = "";
    
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postUrl)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + postUrl)}`;
        break;
      case "copy":
        navigator.clipboard.writeText(postUrl);
        showToast.success("Link copied to clipboard!");
        setShowShareModal(false);
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
      setShowShareModal(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.avatar}>
          {post.author?.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <div style={styles.authorInfo}>
          <h4 style={styles.author}>{post.author?.name || "User"}</h4>
          <span style={styles.date}>
            {new Date(post.createdAt).toLocaleString()}
          </span>
        </div>
      </div>
      <p style={styles.content}>{post.content}</p>
      
      {post.media && post.media.length > 0 && (
        <div style={styles.mediaGrid}>
          {post.media.map((item: any, index: number) => (
            <div key={index} style={styles.mediaItem}>
              {item.type === 'image' ? (
                <img src={item.url} alt="Post media" style={styles.mediaImage} />
              ) : (
                <video src={item.url} controls style={styles.mediaVideo} />
              )}
            </div>
          ))}
        </div>
      )}
      
      {(likeCount > 0 || commentCount > 0) && (
        <div style={styles.stats}>
          {likeCount > 0 && (
            <span style={styles.statText}>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
          )}
          {commentCount > 0 && (
            <span style={styles.statText}>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
          )}
        </div>
      )}

      <div style={styles.actions}>
        <button 
          style={{
            ...styles.actionBtn,
            color: isLiked ? "#2563eb" : "#94a3b8",
            fontWeight: isLiked ? 700 : 600,
          }} 
          onClick={handleLike}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          Like
        </button>
        <button style={styles.actionBtn} onClick={() => setShowComments(!showComments)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Comment
        </button>
        <button style={styles.actionBtn} onClick={() => setShowShareModal(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
          Share
        </button>
      </div>

      {showShareModal && (
        <div style={styles.modalOverlay} onClick={() => setShowShareModal(false)}>
          <div style={styles.shareModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Share Post</h3>
              <button style={styles.closeBtn} onClick={() => setShowShareModal(false)}>×</button>
            </div>
            <div style={styles.shareOptions}>
              <button style={styles.shareBtn} onClick={() => handleShare("twitter")}>
                <div style={{...styles.shareIcon, background: "#1DA1F2"}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                  </svg>
                </div>
                <span style={styles.shareBtnText}>Twitter</span>
              </button>
              <button style={styles.shareBtn} onClick={() => handleShare("facebook")}>
                <div style={{...styles.shareIcon, background: "#1877F2"}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                  </svg>
                </div>
                <span style={styles.shareBtnText}>Facebook</span>
              </button>
              <button style={styles.shareBtn} onClick={() => handleShare("linkedin")}>
                <div style={{...styles.shareIcon, background: "#0A66C2"}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
                    <circle cx="4" cy="4" r="2"/>
                  </svg>
                </div>
                <span style={styles.shareBtnText}>LinkedIn</span>
              </button>
              <button style={styles.shareBtn} onClick={() => handleShare("whatsapp")}>
                <div style={{...styles.shareIcon, background: "#25D366"}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
                  </svg>
                </div>
                <span style={styles.shareBtnText}>WhatsApp</span>
              </button>
              <button style={styles.shareBtn} onClick={() => handleShare("copy")}>
                <div style={{...styles.shareIcon, background: "#6B7280"}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                </div>
                <span style={styles.shareBtnText}>Copy Link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showComments && (
        <div style={styles.commentSection}>
          <form onSubmit={handleComment} style={styles.commentForm}>
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={styles.commentInput}
              disabled={isSubmitting}
            />
            <button 
              type="submit" 
              style={styles.commentBtn}
              disabled={isSubmitting || !commentText.trim()}
            >
              {isSubmitting ? "Posting..." : "Post"}
            </button>
          </form>
          
          {post.comments.length > 0 && (
            <div style={styles.commentsList}>
              {post.comments.map((comment) => (
                <div key={comment._id} style={styles.comment}>
                  <div style={styles.commentAvatar}>
                    {comment.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.commentContent}>
                    <strong style={styles.commentAuthor}>{comment.user.name}</strong>
                    <p style={styles.commentText}>{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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
    alignItems: "center",
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
  },
  authorInfo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },
  author: {
    margin: 0,
    fontWeight: 600,
    color: "#f1f5f9",
    fontSize: "1rem",
  },
  content: {
    marginBottom: "1rem",
    color: "#e2e8f0",
    lineHeight: "1.6",
    fontSize: "0.9375rem",
  },
  date: {
    fontSize: "0.8125rem",
    color: "#94a3b8",
  },
  actions: {
    display: "flex",
    gap: "0.5rem",
    paddingTop: "1rem",
    borderTop: "1px solid #334155",
  },
  actionBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.625rem",
    background: "transparent",
    border: "none",
    borderRadius: "8px",
    color: "#94a3b8",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  } as React.CSSProperties,
  stats: {
    display: "flex",
    gap: "1rem",
    paddingBottom: "0.75rem",
    marginBottom: "0.75rem",
    borderBottom: "1px solid #334155",
  },
  statText: {
    fontSize: "0.8125rem",
    color: "#94a3b8",
  },
  commentSection: {
    marginTop: "1rem",
    paddingTop: "1rem",
    borderTop: "1px solid #334155",
  },
  commentForm: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  commentInput: {
    flex: 1,
    padding: "0.625rem",
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#f1f5f9",
    fontSize: "0.875rem",
    outline: "none",
  },
  commentBtn: {
    padding: "0.625rem 1rem",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  commentsList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.75rem",
  },
  comment: {
    display: "flex",
    gap: "0.75rem",
  },
  commentAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.875rem",
    fontWeight: 600,
    flexShrink: 0,
  },
  commentContent: {
    flex: 1,
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    padding: "0.75rem",
    borderRadius: "8px",
  },
  commentAuthor: {
    fontSize: "0.875rem",
    color: "#f1f5f9",
    marginBottom: "0.25rem",
    display: "block",
  },
  commentText: {
    fontSize: "0.875rem",
    color: "#cbd5e1",
    margin: 0,
    lineHeight: "1.5",
  },
  modalOverlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    animation: "fadeIn 0.2s ease-out",
  },
  shareModal: {
    background: "linear-gradient(135deg, #1e293b, #0f172a)",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "1.25rem",
    width: "90%",
    maxWidth: "320px",
    animation: "slideUp 0.3s ease-out",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  modalTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#f1f5f9",
    margin: 0,
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    fontSize: "1.5rem",
    cursor: "pointer",
    lineHeight: 1,
    padding: 0,
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "6px",
    transition: "all 0.2s",
  } as React.CSSProperties,
  shareOptions: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "0.75rem",
  },
  shareBtn: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.875rem 0.5rem",
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    border: "1px solid #334155",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  } as React.CSSProperties,
  shareIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  shareBtnText: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#f1f5f9",
  },
  mediaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "0.5rem",
    marginBottom: "1rem",
    borderRadius: "8px",
    overflow: "hidden",
  },
  mediaItem: {
    position: "relative" as const,
    width: "100%",
    paddingBottom: "75%",
    overflow: "hidden",
    borderRadius: "8px",
  },
  mediaImage: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  mediaVideo: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
};

export default PostCard;
