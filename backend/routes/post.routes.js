import express from "express";
import auth from "../middleware/auth.js";
import { createPost, getFeed } from "../controllers/post.controller.js";

const router = express.Router();

router.get("/", auth, getFeed);
router.post("/", auth, createPost);

export default router;
