import Connection from "../models/Connection.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

// Send connection request
export const sendConnectionRequest = async (req, res) => {
  try {
    const { recipientId, message } = req.body;

    if (recipientId === req.userId) {
      return res.status(400).json({ message: "Cannot connect with yourself" });
    }

    // Check if connection already exists
    const existing = await Connection.findOne({
      $or: [
        { requester: req.userId, recipient: recipientId },
        { requester: recipientId, recipient: req.userId }
      ]
    });

    if (existing) {
      return res.status(400).json({ message: "Connection already exists" });
    }

    const connection = await Connection.create({
      requester: req.userId,
      recipient: recipientId,
      message
    });

    // Notify recipient
    await Notification.create({
      recipient: recipientId,
      sender: req.userId,
      type: "connection_request",
      content: "sent you a connection request",
      link: `/connections/requests`
    });

    res.status(201).json(connection);
  } catch (error) {
    console.error("Send connection error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Accept connection request
export const acceptConnection = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);

    if (!connection) {
      return res.status(404).json({ message: "Connection not found" });
    }

    if (connection.recipient.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    connection.status = "accepted";
    await connection.save();

    // Notify requester
    await Notification.create({
      recipient: connection.requester,
      sender: req.userId,
      type: "connection_accepted",
      content: "accepted your connection request",
      link: `/profile/${req.userId}`
    });

    res.json(connection);
  } catch (error) {
    console.error("Accept connection error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Reject connection request
export const rejectConnection = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);

    if (!connection) {
      return res.status(404).json({ message: "Connection not found" });
    }

    if (connection.recipient.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    connection.status = "rejected";
    await connection.save();

    res.json({ message: "Connection rejected" });
  } catch (error) {
    console.error("Reject connection error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get my connections
export const getMyConnections = async (req, res) => {
  try {
    const connections = await Connection.find({
      $or: [
        { requester: req.userId, status: "accepted" },
        { recipient: req.userId, status: "accepted" }
      ]
    })
      .populate("requester", "name email profilePic headline")
      .populate("recipient", "name email profilePic headline")
      .sort("-createdAt");

    const formattedConnections = connections.map(conn => {
      const isRequester = conn.requester._id.toString() === req.userId;
      return {
        ...conn.toObject(),
        connection: isRequester ? conn.recipient : conn.requester
      };
    });

    res.json(formattedConnections);
  } catch (error) {
    console.error("Get connections error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get pending requests
export const getPendingRequests = async (req, res) => {
  try {
    const requests = await Connection.find({
      recipient: req.userId,
      status: "pending"
    })
      .populate("requester", "name email profilePic headline")
      .sort("-createdAt");

    res.json(requests);
  } catch (error) {
    console.error("Get requests error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get suggested connections
export const getSuggestedConnections = async (req, res) => {
  try {
    // Get user's existing connections
    const myConnections = await Connection.find({
      $or: [
        { requester: req.userId, status: "accepted" },
        { recipient: req.userId, status: "accepted" }
      ]
    });

    const connectedUserIds = myConnections.map(conn =>
      conn.requester.toString() === req.userId
        ? conn.recipient.toString()
        : conn.requester.toString()
    );

    // Find users not connected
    const suggestions = await User.find({
      _id: { $nin: [...connectedUserIds, req.userId] }
    })
      .select("name email profilePic headline location")
      .limit(10)
      .lean();

    res.json(suggestions);
  } catch (error) {
    console.error("Get suggestions error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove connection
export const removeConnection = async (req, res) => {
  try {
    const connection = await Connection.findOneAndDelete({
      _id: req.params.id,
      $or: [
        { requester: req.userId },
        { recipient: req.userId }
      ]
    });

    if (!connection) {
      return res.status(404).json({ message: "Connection not found" });
    }

    res.json({ message: "Connection removed" });
  } catch (error) {
    console.error("Remove connection error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
