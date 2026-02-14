import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import MainLayout from "./layouts/MainLayout";

import Feed from "./pages/Feed";
import Jobs from "./pages/Jobs/Jobs";
import Projects from "./pages/Projects";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings/Settings";

import Signin from "./pages/Signin";
import Signup from "./pages/Signup";

import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  const { user } = useAuth();

  return (
    <ErrorBoundary>
      <Routes>
        {/* Default Route */}
        <Route
          path="/"
          element={
            user ? <Navigate to="/feed" replace /> : <Navigate to="/signin" replace />
          }
        />

        {/* Public Routes */}
        <Route
          path="/signin"
          element={user ? <Navigate to="/feed" replace /> : <Signin />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/feed" replace /> : <Signup />}
        />

        {/* Protected Routes */}
        <Route
          element={user ? <MainLayout /> : <Navigate to="/signin" replace />}
        >
          <Route path="/feed" element={<Feed />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Catch All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
