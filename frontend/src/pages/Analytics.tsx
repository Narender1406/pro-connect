import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { userAPI } from "../api/user.api";
import { showToast } from "../utils/toast";
import "./Analytics.css";

interface AnalyticsData {
  profileViews: { date: string; count: number }[];
  postEngagement: { likes: number; comments: number; shares: number };
  connectionGrowth: { month: string; count: number }[];
  topSkills: { skill: string; endorsements: number }[];
  jobApplications: { status: string; count: number }[];
}

export default function Analytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    profileViews: [],
    postEngagement: { likes: 0, comments: 0, shares: 0 },
    connectionGrowth: [],
    topSkills: [],
    jobApplications: [],
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data } = await userAPI.getAnalytics();
      // Transform backend data to frontend format
      setAnalytics({
        profileViews: generateMockProfileViews(data.analytics?.profileViews || 0),
        postEngagement: { likes: 234, comments: 89, shares: 45 },
        connectionGrowth: generateMockConnectionGrowth(),
        topSkills: parseSkills(user?.skills || ""),
        jobApplications: [
          { status: "Applied", count: 12 },
          { status: "Reviewing", count: 5 },
          { status: "Interviewed", count: 3 },
          { status: "Accepted", count: 1 },
        ],
      });
    } catch (error) {
      showToast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const generateMockProfileViews = (total: number) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map(date => ({ date, count: Math.floor(Math.random() * 70) + 30 }));
  };

  const generateMockConnectionGrowth = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    let count = 45;
    return months.map(month => {
      count += Math.floor(Math.random() * 20) + 10;
      return { month, count };
    });
  };

  const parseSkills = (skillsString: string) => {
    const skills = skillsString.split(",").map(s => s.trim()).filter(Boolean).slice(0, 5);
    return skills.map(skill => ({
      skill,
      endorsements: Math.floor(Math.random() * 20) + 5
    }));
  };

  if (loading) return <div className="analytics-page"><p>Loading analytics...</p></div>;

  const maxProfileViews = Math.max(...analytics.profileViews.map((d) => d.count), 1);
  const maxConnections = Math.max(...analytics.connectionGrowth.map((d) => d.count), 1);
  const maxEndorsements = Math.max(...analytics.topSkills.map((s) => s.endorsements), 1);

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h1>Profile Analytics</h1>
        <p>Track your professional growth and engagement</p>
      </div>

      <div className="analytics-grid">
        {/* Profile Views Chart */}
        <div className="analytics-card large">
          <h3>Profile Views (Last 7 Days)</h3>
          <div className="chart-container">
            <div className="bar-chart">
              {analytics.profileViews.map((item) => (
                <div key={item.date} className="bar-group">
                  <div className="bar-wrapper">
                    <div
                      className="bar"
                      style={{ height: `${(item.count / maxProfileViews) * 100}%` }}
                    >
                      <span className="bar-value">{item.count}</span>
                    </div>
                  </div>
                  <span className="bar-label">{item.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Post Engagement */}
        <div className="analytics-card">
          <h3>Post Engagement</h3>
          <div className="engagement-stats">
            <div className="engagement-item">
              <div className="engagement-icon likes">❤️</div>
              <div className="engagement-info">
                <span className="engagement-value">{analytics.postEngagement.likes}</span>
                <span className="engagement-label">Likes</span>
              </div>
            </div>
            <div className="engagement-item">
              <div className="engagement-icon comments">💬</div>
              <div className="engagement-info">
                <span className="engagement-value">{analytics.postEngagement.comments}</span>
                <span className="engagement-label">Comments</span>
              </div>
            </div>
            <div className="engagement-item">
              <div className="engagement-icon shares">🔄</div>
              <div className="engagement-info">
                <span className="engagement-value">{analytics.postEngagement.shares}</span>
                <span className="engagement-label">Shares</span>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Growth */}
        <div className="analytics-card large">
          <h3>Connection Growth</h3>
          <div className="chart-container">
            <div className="line-chart">
              <svg width="100%" height="200" viewBox="0 0 600 200">
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>
                <polyline
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="3"
                  points={analytics.connectionGrowth
                    .map((item, i) => {
                      const x = (i / (analytics.connectionGrowth.length - 1)) * 550 + 25;
                      const y = 180 - (item.count / maxConnections) * 150;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                />
                {analytics.connectionGrowth.map((item, i) => {
                  const x = (i / (analytics.connectionGrowth.length - 1)) * 550 + 25;
                  const y = 180 - (item.count / maxConnections) * 150;
                  return (
                    <g key={item.month}>
                      <circle cx={x} cy={y} r="5" fill="#2563eb" />
                      <text x={x} y="195" textAnchor="middle" fill="#94a3b8" fontSize="12">
                        {item.month}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* Top Skills */}
        <div className="analytics-card">
          <h3>Top Skills by Endorsements</h3>
          <div className="skills-list">
            {analytics.topSkills.map((skill) => (
              <div key={skill.skill} className="skill-item">
                <div className="skill-info">
                  <span className="skill-name">{skill.skill}</span>
                  <span className="skill-count">{skill.endorsements}</span>
                </div>
                <div className="skill-bar">
                  <div
                    className="skill-progress"
                    style={{ width: `${(skill.endorsements / maxEndorsements) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Job Applications */}
        <div className="analytics-card">
          <h3>Job Applications Status</h3>
          <div className="applications-chart">
            {analytics.jobApplications.map((app) => (
              <div key={app.status} className="application-item">
                <div className="application-bar-container">
                  <div
                    className={`application-bar ${app.status.toLowerCase()}`}
                    style={{ width: `${(app.count / 12) * 100}%` }}
                  >
                    <span className="application-count">{app.count}</span>
                  </div>
                </div>
                <span className="application-label">{app.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="analytics-card stats-card">
          <h3>Quick Stats</h3>
          <div className="quick-stats">
            <div className="stat-box">
              <span className="stat-icon">👁️</span>
              <span className="stat-value">335</span>
              <span className="stat-label">Total Views</span>
            </div>
            <div className="stat-box">
              <span className="stat-icon">🤝</span>
              <span className="stat-value">128</span>
              <span className="stat-label">Connections</span>
            </div>
            <div className="stat-box">
              <span className="stat-icon">📝</span>
              <span className="stat-value">21</span>
              <span className="stat-label">Applications</span>
            </div>
            <div className="stat-box">
              <span className="stat-icon">⭐</span>
              <span className="stat-value">79</span>
              <span className="stat-label">Endorsements</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
