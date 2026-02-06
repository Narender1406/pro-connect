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

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    /* =========================
       USER PREFERENCES
    ========================= */
    preferences: {
      jobAlerts: {
        type: Boolean,
        default: true,
      },
      autoSave: {
        type: Boolean,
        default: true,
      },
    },

    /* =========================
       NOTIFICATION SETTINGS
    ========================= */
    notifications: {
      applicationUpdates: {
        type: Boolean,
        default: true,
      },
      newsletters: {
        type: Boolean,
        default: false,
      },
    },

    /* =========================
       META
    ========================= */
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
