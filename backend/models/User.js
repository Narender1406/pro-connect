import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePic: {
      type: String,
      default: ""
    },
    bio: {
      type: String,
      default: ""
    },
    headline: {
      type: String,
      default: ""
    },
    location: {
      type: String,
      default: ""
    },
    website: {
      type: String,
      default: ""
    },
    skills: {
      type: String,
      default: ""
    },
    experience: {
      type: String,
      default: ""
    },
    education: {
      type: String,
      default: ""
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    phone: {
      type: String,
      default: ""
    },
    settings: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      connectionRequests: { type: Boolean, default: true },
      jobAlerts: { type: Boolean, default: true },
      messageNotifications: { type: Boolean, default: true },
      profileVisibility: { type: String, enum: ["public", "connections", "private"], default: "public" },
      showEmail: { type: Boolean, default: false },
      showLocation: { type: Boolean, default: true },
      twoFactorAuth: { type: Boolean, default: false },
      language: { type: String, default: "en" },
      timezone: { type: String, default: "UTC" }
    },
    projects: [{
      title: String,
      description: String,
      techStack: String,
      liveUrl: String,
      githubUrl: String,
      createdAt: { type: Date, default: Date.now }
    }],
    analytics: {
      profileViews: { type: Number, default: 0 },
      postViews: { type: Number, default: 0 },
      searchAppearances: { type: Number, default: 0 }
    },
    isVerified: { type: Boolean, default: false },
    lastPasswordChange: { type: Date, default: Date.now },
    accountCreated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
