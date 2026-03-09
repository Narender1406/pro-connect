import Notification from "../models/Notification.js";

// Get user notifications
export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (page - 1) * limit;

    const query = { recipient: req.userId };
    if (unreadOnly === "true") {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate("sender", "name profilePic")
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipient: req.userId,
      isRead: false
    });

    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: "Marked as read" });
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Mark all as read
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.userId, isRead: false },
      { isRead: true }
    );
    res.json({ message: "All marked as read" });
  } catch (error) {
    console.error("Mark all read error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
