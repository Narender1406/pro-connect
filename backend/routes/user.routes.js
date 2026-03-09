import express from "express";
import { getProfile, updateProfile, updateEmail, updatePassword, updatePhone, deleteAccount, updateSettings, addProject, deleteProject, getAnalytics } from "../controllers/user.controller.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch {
    res.sendStatus(401);
  }
};

router.get("/profile", auth, getProfile);
router.put("/profile", auth, updateProfile);
router.patch("/email", auth, updateEmail);
router.patch("/password", auth, updatePassword);
router.patch("/phone", auth, updatePhone);
router.delete("/account", auth, deleteAccount);
router.patch("/settings", auth, updateSettings);
router.post("/projects", auth, addProject);
router.delete("/projects/:id", auth, deleteProject);
router.get("/analytics", auth, getAnalytics);

export default router;
