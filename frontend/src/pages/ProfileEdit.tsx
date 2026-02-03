import { useEffect, useState } from "react";
import {  getProfile , updateProfile } from "../api/auth.api";
import { useNavigate } from "react-router-dom";
import "./ProfileEdit.css";

const ProfileEdit = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/signin");
      return;
    }

    const loadProfile = async () => {
      try {
        const user = await getProfile(token);
        setName(user.name);
        setEmail(user.email);
      } catch (err) {
        console.error(err);
        setError("Failed to load profile");
      }
    };

    loadProfile();
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      await updateProfile(token, {  name , email } );
      navigate("/feed");
    } catch (err) {
      console.error(err);
      setError("Profile update failed");
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <h2>Edit Profile 👤</h2>

        {error && <p style={styles.error}>{error}</p>}

        <input
          style={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          required
        />

        <input
          style={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />

        <button style={styles.button}>Save Changes</button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg,#11998e,#38ef7d)",
  },
  card: {
    background: "#fff",
    padding: "40px",
    borderRadius: "14px",
    width: "360px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  button: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    background: "#11998e",
    border: "none",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
  error: {
    color: "red",
    marginBottom: "10px",
    textAlign: "center" as const,
  },
};

export default ProfileEdit;
