import express from "express";
import { searchUsers, getUserById } from "../controllers/search.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/users", protect, searchUsers);
router.get("/users/:id", protect, getUserById);

export default router;
