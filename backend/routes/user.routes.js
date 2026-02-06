import express from "express";
import User from "../models/User.model.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.sendStatus(401);
  }
};

router.get("/profile", auth, async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  res.json(user);
});

router.put("/profile", auth, async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.userId,
    req.body,
    { new: true }
  ).select("-password");

  res.json(user);
});

export default router;
