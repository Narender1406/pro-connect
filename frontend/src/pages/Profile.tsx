import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../services/user.api";
import { useAuth } from "../context/AuthContext";
import ActivityTabs from "../components/ActivityTabs";
import "./Profile.css";

type ProfileForm = {
  name: string;
  bio: string;
  headline: string;
  location: string;
  website: string;
  skills: string;
  experience: string;
  education: string;
};

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    bio: "",
    headline: "",
    location: "",
    website: "",
    skills: "",
    experience: "",
    education: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProfile();
        const data = response.data;
        setForm({
          name: data.name || "",
          bio: data.bio || "",
          headline: data.headline || "",
          location: data.location || "",
          website: data.website || "",
          skills: data.skills || "",
          experience: data.experience || "",
          education: data.education || "",
        });
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await updateProfile(form);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-wrapper">
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar">
                {form.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="avatar-badge"></div>
            </div>
            <div className="profile-info">
              <h1>{form.name || "Your Name"}</h1>
              <p className="headline">{form.headline || "Add your professional headline"}</p>
              <div className="meta-info">
                {form.location && (
                  <span className="meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {form.location}
                  </span>
                )}
                {form.website && (
                  <a href={form.website} target="_blank" rel="noopener noreferrer" className="meta-item link">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                    </svg>
                    Website
                  </a>
                )}
                <span className="meta-item">{user?.email}</span>
              </div>
            </div>
            <button className="edit-toggle-btn" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {isEditing ? (
            <div className="profile-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" />
                </div>
                <div className="form-group">
                  <label>Headline</label>
                  <input name="headline" value={form.headline} onChange={handleChange} placeholder="Software Engineer at Company" />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input name="location" value={form.location} onChange={handleChange} placeholder="San Francisco, CA" />
                </div>
                <div className="form-group">
                  <label>Website</label>
                  <input name="website" value={form.website} onChange={handleChange} placeholder="https://yourwebsite.com" />
                </div>
              </div>

              <div className="form-group">
                <label>About</label>
                <textarea name="bio" value={form.bio} onChange={handleChange} placeholder="Tell us about yourself..." rows={4} />
              </div>

              <div className="form-group">
                <label>Skills (comma separated)</label>
                <input name="skills" value={form.skills} onChange={handleChange} placeholder="React, Node.js, TypeScript" />
              </div>

              <div className="form-group">
                <label>Experience</label>
                <textarea name="experience" value={form.experience} onChange={handleChange} placeholder="Your work experience..." rows={3} />
              </div>

              <div className="form-group">
                <label>Education</label>
                <textarea name="education" value={form.education} onChange={handleChange} placeholder="Your education background..." rows={2} />
              </div>

              <button className="save-btn" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          ) : (
            <div className="profile-view">
              {form.bio && (
                <section className="profile-section">
                  <h3>About</h3>
                  <p>{form.bio}</p>
                </section>
              )}

              {form.skills && (
                <section className="profile-section">
                  <h3>Skills</h3>
                  <div className="skills-grid">
                    {form.skills.split(",").filter(Boolean).map((skill, i) => (
                      <span key={i} className="skill-tag">{skill.trim()}</span>
                    ))}
                  </div>
                </section>
              )}

              {form.experience && (
                <section className="profile-section">
                  <h3>Experience</h3>
                  <p>{form.experience}</p>
                </section>
              )}

              {form.education && (
                <section className="profile-section">
                  <h3>Education</h3>
                  <p>{form.education}</p>
                </section>
              )}
            </div>
          )}
        </div>

        <div className="profile-activity">
          <ActivityTabs />
        </div>
      </div>
    </div>
  );
}
