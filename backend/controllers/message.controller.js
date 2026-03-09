import Message from "../models/Message.js";

export const getConversations = async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: req.userId }, { recipient: req.userId }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", req.userId] },
              "$recipient",
              "$sender"
            ]
          },
          lastMessage: { $first: "$$ROOT" }
        }
      }
    ]);

    const populated = await Message.populate(conversations, {
      path: "lastMessage.sender lastMessage.recipient",
      select: "name profilePic"
    });

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: req.userId, recipient: userId },
        { sender: userId, recipient: req.userId }
      ]
    })
      .populate("sender recipient", "name profilePic")
      .sort("createdAt")
      .limit(100);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    const message = await Message.create({
      sender: req.userId,
      recipient: recipientId,
      content
    });

    const populated = await Message.findById(message._id)
      .populate("sender recipient", "name profilePic");

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    await Message.updateMany(
      { sender: userId, recipient: req.userId, isRead: false },
      { isRead: true }
    );
    res.json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
