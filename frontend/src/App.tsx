import { Routes, Route, Navigate } from "react-router-dom";
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
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public Routes */}
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes inside Layout */}
        <Route element={<MainLayout />}>
          <Route path="/feed" element={<Feed />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
