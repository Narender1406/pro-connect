import express from "express";
import {
  getJobs,
  getJobById,
  createJob,
  applyToJob,
  updateApplicationStatus,
  getMyApplications,
  getMyJobs,
  deleteJob
} from "../controllers/job.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getJobs);
router.get("/my-applications", protect, getMyApplications);
router.get("/my-jobs", protect, getMyJobs);
router.get("/:id", getJobById);
router.post("/", protect, createJob);
router.post("/:id/apply", protect, applyToJob);
router.patch("/application-status", protect, updateApplicationStatus);
router.delete("/:id", protect, deleteJob);

export default router;
