import express from "express";
import { getJobs, createJob } from "../controllers/job.controller.js";
import auth from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", auth ,getJobs);           // Public
router.post("/", auth, createJob);  // Admin / Protected

export default router;
