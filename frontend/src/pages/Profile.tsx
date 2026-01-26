import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../services/user.api";
import { useAuth } from "../context/AuthContext";
import ActivityTabs from "../components/ActivityTabs";
import "./Profile.css";

type ProfileForm = {
  name: string;
  bio: string;
  skills: string;
};

export default function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    bio: "",
    skills: "",
    
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fetch profile on load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setForm({
          name: data.name || "",
          bio: data.bio || "",
          skills: data.skills || "",
        });
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      await updateProfile(form);
      alert("Profile updated successfully ✅");
    } catch (err) {
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
    <ActivityTabs />
  };

  if (loading) return <p style={{ padding: 20 }}>Loading profile...</p>;

  return (
  

<div className="profile-wrapper">
  <div className="profile-card">

    <div className="profile-header">
      <div className="profile-avatar">
        {form.name?.charAt(0).toUpperCase() || "U"}
      </div>

      <div className="profile-title">
        <h2>{form.name || "Your Profile"}</h2>
        <p>{user?.email}</p>
      </div>
    </div>

    {error && <div className="profile-error">{error}</div>}

    <div className="profile-section">
      <label>Name</label>
      <input
        className="profile-input"
        name="name"
        value={form.name}
        onChange={handleChange}
      />
    </div>

    <div className="profile-section">
      <label>Bio</label>
      <textarea
        className="profile-textarea"
        name="bio"
        value={form.bio}
        onChange={handleChange}
      />
    </div>

    <div className="profile-section">
      <label>Skills (comma separated)</label>
      <input
        className="profile-input"
        name="skills"
        value={form.skills}
        onChange={handleChange}
      />

      <div className="skills-container">
        {form.skills
          .split(",")
          .filter(Boolean)
          .map((skill, i) => (
            <span key={i} className="skill-chip">
              {skill.trim()}
            </span>
          ))}
      </div>
    </div>

    <button
      className="profile-save-btn"
      onClick={handleSave}
      disabled={saving}
    >
      {saving ? "Saving..." : "Save Changes"}
    </button>

  </div>
</div>

         
   
  )};