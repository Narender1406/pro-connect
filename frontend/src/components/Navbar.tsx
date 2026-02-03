import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme ,ThemeProvider  } from "../context/ThemeContext";
import { Link , useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } =  useTheme();

   const handleLogout = () => {
    logout();
    navigate("/signin");
  };
  return (
    <nav className="navbar">
      <h2 className="logo">CareerTrack</h2>

      {user && (
        <div className="nav-links">
          <NavLink to="/feed">Feed</NavLink>
          <NavLink to="/jobs">Jobs</NavLink>
          <NavLink to="/projects">Projects</NavLink>
          <NavLink to="/profile">Profile</NavLink>

          <button className="theme-btn" onClick={toggleTheme}>
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>

          <button className="logout" onClick={logout}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}