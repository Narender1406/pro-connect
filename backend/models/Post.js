import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Post content is required"],
      trim: true,
      maxlength: [5000, "Content cannot exceed 5000 characters"]
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    media: [{
      type: { type: String, enum: ["image", "video", "document"] },
      url: String,
      thumbnail: String
    }],
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    comments: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: { type: String, required: true, maxlength: 1000 },
      createdAt: { type: Date, default: Date.now }
    }],
    shares: {
      type: Number,
      default: 0
    },
    views: {
      type: Number,
      default: 0
    },
    tags: [{
      type: String,
      trim: true
    }],
    visibility: {
      type: String,
      enum: ["public", "connections", "private"],
      default: "public"
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for like count
postSchema.virtual("likeCount").get(function() {
  return this.likes?.length || 0;
});

// Virtual for comment count
postSchema.virtual("commentCount").get(function() {
  return this.comments?.length || 0;
});

// Index for performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ tags: 1 });

export default mongoose.model("Post", postSchema);
