import express from "express";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Get profile
router.get("/", authMiddleware, (req, res) => {
  res.json({
    name: "Narender",
    title: "Frontend Developer",
    location: "India",
    skills: ["React", "JavaScript", "CSS"],
  });
});

// Upload resume
router.post("/resume", authMiddleware, (req, res) => {
  res.json({ resume: "resume-url.pdf" });
});

export default router; // 🔴 THIS WAS MISSING
