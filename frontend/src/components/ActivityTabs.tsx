import { useEffect, useState } from "react";
import { getMyPosts, getSavedJobs } from "../services/activity.api";

type Post = {
  _id: string;
  content: string;
  createdAt: string;
};

type Job = {
  _id: string;
  title: string;
  company: string;
};

export default function ActivityTabs() {
  const [tab, setTab] = useState<"posts" | "jobs">("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyPosts(), getSavedJobs()])
      .then(([postsRes, jobsRes]) => {
        setPosts(postsRes || []);
        setJobs(jobsRes || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading activity...</p>;

  return (
    <div className="activity-box">
      <div className="activity-tabs">
        <button
          className={tab === "posts" ? "active" : ""}
          onClick={() => setTab("posts")}
        >
          Posts
        </button>
        <button
          className={tab === "jobs" ? "active" : ""}
          onClick={() => setTab("jobs")}
        >
          Jobs
        </button>
      </div>

      {tab === "posts" && (
        <div>
          {posts.length === 0 && <p>No posts yet</p>}
          {posts.map((p) => (
            <div key={p._id} className="activity-card">
              <p>{p.content}</p>
              <span>{new Date(p.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "jobs" && (
        <div>
          {jobs.length === 0 && <p>No saved jobs</p>}
          {jobs.map((j) => (
            <div key={j._id} className="activity-card">
              <h4>{j.title}</h4>
              <p>{j.company}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
