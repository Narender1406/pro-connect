import express from "express";
import protect from "../middleware/auth.js";
import { createPost, getFeed } from "../controllers/post.controller.js";

const router = express.Router();

router.get("/", protect, getFeed);
router.post("/", protect, createPost);


export default router;
