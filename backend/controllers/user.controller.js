import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select("-password");
    
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const existing = await User.findOne({ email, _id: { $ne: req.user.id } });
    if (existing) return res.status(400).json({ message: "Email already in use" });
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { email },
      { new: true }
    ).select("-password");
    
    res.json({ message: "Email updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });
    
    user.password = await bcrypt.hash(newPassword, 10);
    user.lastPasswordChange = Date.now();
    await user.save();
    
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updatePhone = async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { phone },
      { new: true }
    ).select("-password");
    
    res.json({ message: "Phone updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { settings: { ...req.body } } },
      { new: true }
    ).select("-password");
    
    res.json({ message: "Settings updated successfully", settings: user.settings });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const addProject = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.projects.push(req.body);
    await user.save();
    
    res.json({ message: "Project added successfully", projects: user.projects });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.projects = user.projects.filter(p => p._id.toString() !== req.params.id);
    await user.save();
    
    res.json({ message: "Project deleted successfully", projects: user.projects });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("analytics projects");
    res.json({ analytics: user.analytics, projectCount: user.projects.length });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
