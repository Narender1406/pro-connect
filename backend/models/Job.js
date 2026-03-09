import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"]
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    locationType: {
      type: String,
      enum: ["Remote", "Hybrid", "On-site"],
      default: "On-site"
    },
    jobType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship", "Freelance"],
      required: true
    },
    experienceLevel: {
      type: String,
      enum: ["Entry", "Mid", "Senior", "Lead", "Executive"],
      required: true
    },
    salary: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: "USD" },
      period: { type: String, enum: ["hourly", "monthly", "yearly"], default: "yearly" }
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
      minlength: [50, "Description must be at least 50 characters"]
    },
    requirements: [{
      type: String,
      trim: true
    }],
    responsibilities: [{
      type: String,
      trim: true
    }],
    skills: [{
      type: String,
      trim: true
    }],
    benefits: [{
      type: String,
      trim: true
    }],
    applicationDeadline: {
      type: Date
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    companyLogo: {
      type: String,
      default: ""
    },
    companyWebsite: {
      type: String
    },
    applicants: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      appliedAt: { type: Date, default: Date.now },
      status: { 
        type: String, 
        enum: ["Applied", "Reviewing", "Shortlisted", "Interviewed", "Rejected", "Accepted"],
        default: "Applied"
      },
      resume: String,
      coverLetter: String
    }],
    views: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    category: {
      type: String,
      enum: ["Technology", "Marketing", "Sales", "Design", "Finance", "HR", "Operations", "Other"],
      default: "Other"
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for applicant count
jobSchema.virtual("applicantCount").get(function() {
  return this.applicants?.length || 0;
});

// Index for search optimization
jobSchema.index({ title: "text", company: "text", description: "text" });
jobSchema.index({ location: 1, jobType: 1, experienceLevel: 1 });

export default mongoose.model("Job", jobSchema);

