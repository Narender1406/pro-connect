import express from "express";
import {
  sendConnectionRequest,
  acceptConnection,
  rejectConnection,
  getMyConnections,
  getPendingRequests,
  getSuggestedConnections,
  removeConnection
} from "../controllers/connection.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/request", protect, sendConnectionRequest);
router.post("/:id/accept", protect, acceptConnection);
router.post("/:id/reject", protect, rejectConnection);
router.get("/", protect, getMyConnections);
router.get("/requests", protect, getPendingRequests);
router.get("/suggestions", protect, getSuggestedConnections);
router.delete("/:id", protect, removeConnection);

export default router;
