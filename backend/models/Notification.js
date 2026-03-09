import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    type: {
      type: String,
      enum: [
        "connection_request",
        "connection_accepted",
        "post_like",
        "post_comment",
        "job_application",
        "application_status",
        "profile_view",
        "mention"
      ],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    link: String,
    isRead: {
      type: Boolean,
      default: false
    },
    metadata: {
      postId: mongoose.Schema.Types.ObjectId,
      jobId: mongoose.Schema.Types.ObjectId,
      applicationId: mongoose.Schema.Types.ObjectId
    }
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
