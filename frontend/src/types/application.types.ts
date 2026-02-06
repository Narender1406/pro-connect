export type ApplicationStatus =
  | "applied"
  | "review"
  | "shortlisted"
  | "rejected"
  | "selected";

export interface Application {
  _id: string;
  company: string;
  role: string;
  location: string;
  status: ApplicationStatus;
  appliedAt: string;
}
