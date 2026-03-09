import express from "express";
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead
} from "../controllers/message.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/conversations", protect, getConversations);
router.get("/:userId", protect, getMessages);
router.post("/", protect, sendMessage);
router.patch("/:userId/read", protect, markAsRead);

export default router;
