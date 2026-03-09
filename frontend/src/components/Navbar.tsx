import { NavLink, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiLayers,
  FiBriefcase,
  FiUser,
  FiSettings,
  FiMessageSquare,
  FiLogOut,
  FiBarChart2,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <span className="logo" onClick={() => navigate("/feed")}>
          ProConnect
        </span>
      </div>

      <div className="nav-center">
        <NavItem to="/feed" icon={<FiHome />} label="Home" />
        <NavItem to="/jobs" icon={<FiBriefcase />} label="Jobs" />
        <NavItem to="/messages" icon={<FiMessageSquare />} label="Messages" />
        <NavItem to="/projects" icon={<FiLayers />} label="Projects" />
        <NavItem to="/analytics" icon={<FiBarChart2 />} label="Analytics" />
        <NavItem to="/profile" icon={<FiUser />} label="Profile" />
        <NavItem to="/settings" icon={<FiSettings />} label="Settings" />
      </div>

      <div className="nav-right">
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
