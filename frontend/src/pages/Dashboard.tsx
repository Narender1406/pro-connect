import { useEffect, useState } from "react";
import { jobAPI } from "../api/job.api";
import { postAPI } from "../api/post.api";
import { connectionAPI } from "../api/connection.api";
import "./Dashboard.css";

export default function Dashboard() {
  const [stats, setStats] = useState({
    connections: 0,
    posts: 0,
    applications: 0,
    profileViews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [connections, applications] = await Promise.all([
        connectionAPI.getConnections(),
        jobAPI.getMyApplications(),
      ]);
      
      setStats({
        connections: connections.length,
        posts: 0, // Will be updated when we fetch user posts
        applications: applications.length,
        profileViews: Math.floor(Math.random() * 100), // Mock data
      });
    } catch (error) {
      console.error("Load stats error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon connections">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>{stats.connections}</h3>
            <p>Connections</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon applications">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>{stats.applications}</h3>
            <p>Applications</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon posts">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>{stats.posts}</h3>
            <p>Posts</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon views">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>{stats.profileViews}</h3>
            <p>Profile Views</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">📝</div>
              <div className="activity-content">
                <p>You posted an update</p>
                <span>2 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">🤝</div>
              <div className="activity-content">
                <p>New connection request</p>
                <span>5 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">💼</div>
              <div className="activity-content">
                <p>Applied to Software Engineer position</p>
                <span>1 day ago</span>
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button className="action-btn">
              <span>📝</span>
              Create Post
            </button>
            <button className="action-btn">
              <span>💼</span>
              Find Jobs
            </button>
            <button className="action-btn">
              <span>🤝</span>
              Grow Network
            </button>
            <button className="action-btn">
              <span>👤</span>
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
