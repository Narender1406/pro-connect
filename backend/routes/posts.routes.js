import express from "express";
import {
  getFeed,
  createPost,
  toggleLike,
  addComment,
  incrementShare,
  deletePost,
  updatePost,
  getUserPosts
} from "../controllers/post.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/feed", protect, getFeed);
router.get("/user/:userId", getUserPosts);
router.post("/", protect, createPost);
router.post("/:id/like", protect, toggleLike);
router.post("/:id/comment", protect, addComment);
router.post("/:id/share", protect, incrementShare);
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);

export default router;
