import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "blocked"],
      default: "pending"
    },
    message: {
      type: String,
      maxlength: 300
    }
  },
  { timestamps: true }
);

// Compound index to prevent duplicate connections
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

export default mongoose.model("Connection", connectionSchema);
