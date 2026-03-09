// User Types
export interface User {
  _id: string;
  name: string;
  email: string;
  profilePic?: string;
  bio?: string;
  headline?: string;
  location?: string;
  website?: string;
  skills?: string;
  experience?: string;
  education?: string;
  createdAt: string;
  updatedAt: string;
}

// Post Types
export interface Post {
  _id: string;
  content: string;
  author: User;
  media?: Array<{
    type: "image" | "video" | "document";
    url: string;
    thumbnail?: string;
  }>;
  likes: string[];
  comments: Comment[];
  shares: number;
  views: number;
  tags?: string[];
  visibility: "public" | "connections" | "private";
  isPinned: boolean;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
}

export interface Comment {
  _id: string;
  user: User;
  text: string;
  createdAt: string;
}

// Job Types
export interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  locationType: "Remote" | "Hybrid" | "On-site";
  jobType: "Full-time" | "Part-time" | "Contract" | "Internship" | "Freelance";
  experienceLevel: "Entry" | "Mid" | "Senior" | "Lead" | "Executive";
  salary?: {
    min: number;
    max: number;
    currency: string;
    period: "hourly" | "monthly" | "yearly";
  };
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  benefits: string[];
  applicationDeadline?: string;
  postedBy: User;
  companyLogo?: string;
  companyWebsite?: string;
  applicants: JobApplication[];
  views: number;
  isActive: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
  applicantCount: number;
}

export interface JobApplication {
  _id: string;
  user: User;
  appliedAt: string;
  status: "Applied" | "Reviewing" | "Shortlisted" | "Interviewed" | "Rejected" | "Accepted";
  resume?: string;
  coverLetter?: string;
}

// Connection Types
export interface Connection {
  _id: string;
  requester: User;
  recipient: User;
  status: "pending" | "accepted" | "rejected" | "blocked";
  message?: string;
  createdAt: string;
  updatedAt: string;
}

// Notification Types
export interface Notification {
  _id: string;
  recipient: string;
  sender?: User;
  type:
    | "connection_request"
    | "connection_accepted"
    | "post_like"
    | "post_comment"
    | "job_application"
    | "application_status"
    | "profile_view"
    | "mention";
  content: string;
  link?: string;
  isRead: boolean;
  metadata?: {
    postId?: string;
    jobId?: string;
    applicationId?: string;
  };
  createdAt: string;
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
