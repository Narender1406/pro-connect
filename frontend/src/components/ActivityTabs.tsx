import { useEffect, useState } from "react";
import { getUserActivity } from "../api/activity.api";

type Activity = {
  _id: string;
  title?: string;
  description?: string;
};

type Post = {
  _id: string;
  title: string;
  description?: string;
};

const ActivityTabs = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        setLoading(true);
        const res = await getUserActivity();

        // ✅ STRICT ARRAY GUARD
        const activities = Array.isArray(res?.data?.data)
          ? res.data.data
          : [];

        const posts = activities
          .filter((activity: Activity) => activity.title)
          .map((activity: Activity) => ({
            _id: activity._id,
            title: activity.title || "",
            description: activity.description,
          }));

        setPosts(posts);
      } catch (err) {
        console.error("Activity error:", err);
        setError("Failed to load activity");
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    loadActivity();
  }, []);

  if (loading) return <p>Loading activity...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="activity-list">
      {posts.length > 0 ? (
        posts.map((post) => (
          <div key={post._id} className="activity-item">
            <h4>{post.title}</h4>
            {post.description && <p>{post.description}</p>}
          </div>
        ))
      ) : (
        <p className="empty-state">No activity found</p>
      )}
    </div>
  );
};

export default ActivityTabs;
