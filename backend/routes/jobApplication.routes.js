import express from "express";
import JobApplication from "../models/JobApplication.model.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

/* APPLY JOB */
router.post("/apply", authMiddleware, async (req, res) => {
  const { jobId } = req.body;

  const exists = await JobApplication.findOne({
    userId: req.user.id,
    jobId,
  });

  if (exists) {
    return res.status(400).json({ message: "Already applied" });
  }

  const application = await JobApplication.create({
    userId: req.user.id,
    jobId,
    status: "applied",
  });

  res.status(201).json(application);
});

/* GET USER APPLICATIONS */
router.get("/my-applications", authMiddleware, async (req, res) => {
  const apps = await JobApplication.find({ userId: req.user.id });
  res.json(apps);
});

export default router;
