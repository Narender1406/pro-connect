export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  experience: string;
  type: "Full Time" | "Part Time";
  remote: boolean;
};
