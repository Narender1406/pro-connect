import { useState } from "react";

export default function CommentList({ comments, onAddComment }) {
  const [text, setText] = useState("");

  function submitComment() {
    if (!text.trim()) return;
    onAddComment(text);
    setText("");
  }

  return (
    <div className="comments">
      {comments.map((c, i) => (
        <p key={i} className="comment">💬 {c}</p>
      ))}

      <input
        placeholder="Write a comment..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={submitComment}>Comment</button>
    </div>
  );
}
