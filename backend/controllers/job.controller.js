import Job from "../models/Job.js";
import Notification from "../models/Notification.js";

// Get all jobs with advanced filtering
export const getJobs = async (req, res) => {
  try {
    const {
      search,
      location,
      jobType,
      experienceLevel,
      locationType,
      category,
      salaryMin,
      salaryMax,
      page = 1,
      limit = 10,
      sort = "-createdAt"
    } = req.query;

    const query = { isActive: true };

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Filters
    if (location) query.location = new RegExp(location, "i");
    if (jobType) query.jobType = jobType;
    if (experienceLevel) query.experienceLevel = experienceLevel;
    if (locationType) query.locationType = locationType;
    if (category) query.category = category;
    
    // Salary range
    if (salaryMin || salaryMax) {
      query["salary.min"] = {};
      if (salaryMin) query["salary.min"].$gte = Number(salaryMin);
      if (salaryMax) query["salary.max"].$lte = Number(salaryMax);
    }

    const skip = (page - 1) * limit;

    const jobs = await Job.find(query)
      .populate("postedBy", "name email profilePic")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Job.countDocuments(query);

    res.json({
      jobs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get jobs error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single job
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate("postedBy", "name email profilePic headline")
      .populate("applicants.user", "name email profilePic headline");

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(job);
  } catch (error) {
    console.error("Get job error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create job
export const createJob = async (req, res) => {
  try {
    const job = await Job.create({
      ...req.body,
      postedBy: req.userId
    });

    res.status(201).json(job);
  } catch (error) {
    console.error("Create job error:", error);
    res.status(400).json({ message: error.message });
  }
};

// Apply to job
export const applyToJob = async (req, res) => {
  try {
    const { resume, coverLetter } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if already applied
    const alreadyApplied = job.applicants.some(
      app => app.user.toString() === req.userId
    );

    if (alreadyApplied) {
      return res.status(400).json({ message: "Already applied to this job" });
    }

    job.applicants.push({
      user: req.userId,
      resume,
      coverLetter,
      status: "Applied"
    });

    await job.save();

    // Create notification for job poster
    await Notification.create({
      recipient: job.postedBy,
      sender: req.userId,
      type: "job_application",
      content: `New application for ${job.title}`,
      link: `/jobs/${job._id}`,
      metadata: { jobId: job._id }
    });

    res.json({ message: "Application submitted successfully" });
  } catch (error) {
    console.error("Apply job error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update application status
export const updateApplicationStatus = async (req, res) => {
  try {
    const { jobId, applicantId, status } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if user is job poster
    if (job.postedBy.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const applicant = job.applicants.id(applicantId);
    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    applicant.status = status;
    await job.save();

    // Notify applicant
    await Notification.create({
      recipient: applicant.user,
      type: "application_status",
      content: `Your application for ${job.title} is now ${status}`,
      link: `/jobs/${job._id}`,
      metadata: { jobId: job._id }
    });

    res.json({ message: "Status updated successfully" });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user's applications
export const getMyApplications = async (req, res) => {
  try {
    const jobs = await Job.find({
      "applicants.user": req.userId
    })
      .populate("postedBy", "name profilePic")
      .select("title company location jobType applicants createdAt")
      .lean();

    const applications = jobs.map(job => {
      const application = job.applicants.find(
        app => app.user.toString() === req.userId
      );
      return {
        ...job,
        applicationStatus: application.status,
        appliedAt: application.appliedAt
      };
    });

    res.json(applications);
  } catch (error) {
    console.error("Get applications error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get jobs posted by user
export const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.userId })
      .sort("-createdAt")
      .lean();

    res.json(jobs);
  } catch (error) {
    console.error("Get my jobs error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete job
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.postedBy.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await job.deleteOne();
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Delete job error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
