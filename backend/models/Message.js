import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text"
    }
  },
  { timestamps: true }
);

messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

export default mongoose.model("Message", messageSchema);
