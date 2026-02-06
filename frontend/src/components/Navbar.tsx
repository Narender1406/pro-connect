// src/components/Navbar.tsx
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiLayers,
  FiBriefcase,
  FiUser,
  FiSettings,
  FiSun,
  FiMoon,
  FiLogOut,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  return (
    <nav className="navbar">
      {/* LEFT */}
      <div className="nav-left">
        <span className="logo" onClick={() => navigate("/feed")}>
          CareerTrack
        </span>
      </div>

      {/* CENTER */}
      <div className="nav-center">
        <NavItem to="/feed" icon={<FiHome />} label="Feed" />
        <NavItem to="/jobs" icon={<FiBriefcase />} label="Jobs" />
        <NavItem to="/projects" icon={<FiLayers />} label="Projects" />
        <NavItem to="/profile" icon={<FiUser />} label="Profile" />
        <NavItem to="/settings" icon={<FiSettings />} label="Settings" />
      </div>

      {/* RIGHT */}
      <div className="nav-right">
        <button
          className="icon-btn"
          aria-label="Toggle theme"
          onClick={toggleTheme}
        >
          {theme === "dark" ? <FiSun /> : <FiMoon />}
        </button>

        <button
          className="icon-btn danger"
          aria-label="Logout"
          onClick={handleLogout}
        >
          <FiLogOut />
        </button>
      </div>
    </nav>
  );
}

/* ---------- Nav Item ---------- */

type NavItemProps = {
  to: string;
  icon: React.ReactNode;
  label: string;
};

function NavItem({ to, icon, label }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `nav-item ${isActive ? "active" : ""}`
      }
    >
      <span className="nav-icon">{icon}</span>
      <span className="nav-label">{label}</span>
    </NavLink>
  );
}
