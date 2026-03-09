import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    logo: String,
    coverImage: String,
    tagline: {
      type: String,
      maxlength: 150
    },
    description: String,
    industry: {
      type: String,
      enum: [
        "Technology",
        "Finance",
        "Healthcare",
        "Education",
        "Retail",
        "Manufacturing",
        "Consulting",
        "Media",
        "Other"
      ]
    },
    size: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]
    },
    founded: Number,
    website: String,
    location: {
      headquarters: String,
      offices: [String]
    },
    socialLinks: {
      linkedin: String,
      twitter: String,
      facebook: String,
      instagram: String
    },
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    admins: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    verified: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

companySchema.index({ name: "text", description: "text" });

export default mongoose.model("Company", companySchema);
