import User from "../models/User.model.js";

export const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "preferences notifications"
    );

    res.json(user);
  } catch (error) {
    console.error("GET SETTINGS ERROR:", error);
    res.status(500).json({ message: "Failed to load settings" });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.preferences = {
      ...user.preferences,
      ...req.body.preferences,
    };

    user.notifications = {
      ...user.notifications,
      ...req.body.notifications,
    };

    await user.save();
    res.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("UPDATE SETTINGS ERROR:", error);
    res.status(500).json({ message: "Failed to update settings" });
  }
};
