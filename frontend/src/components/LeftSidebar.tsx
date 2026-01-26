export default function LeftSidebar() {
  return (
    <div className="sidebar">
      <h3>Career Snapshot</h3>

      <p><strong>Narender</strong></p>
      <p>Frontend Developer</p>

      <hr />

      <p>🧠 Skills: 8</p>
      <p>💼 Jobs Applied: 12</p>
      <p>🚀 Projects: 5</p>

      <progress value="65" max="100"></progress>
      <small>Profile Completion: 65%</small>
    </div>
  );
}
