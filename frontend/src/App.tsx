import {  Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

import Feed from "./pages/Feed";
import Jobs from "./pages/Jobs";
import Projects from "./pages/Projects";
import Profile from "./pages/Profile";

import Signin from "./pages/Signin";
import Signup from "./pages/Signup";

export default function App() {
  return (
  
      <Routes>
       
        {/* Public routes */}
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected layout */}
        <Route element={<MainLayout />}>
          <Route path="/feed" element={<Feed />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Default */}
        <Route path="*" element={<Navigate to="/feed" />} />

      </Routes>
    
  );
}
