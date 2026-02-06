import { useState } from "react";
import "./JobFilters.css";

export type JobFilterState = {
  profile: string;
  location: string;
  experience: string;
  salary: string;
  remote: boolean;
  partTime: boolean;
  myCity: boolean;
};

type Props = {
  onApply: (filters: JobFilterState) => void;
};

export default function JobFilters({ onApply }: Props) {
  const [filters, setFilters] = useState<JobFilterState>({
    profile: "",
    location: "",
    experience: "",
    salary: "",
    remote: false,
    partTime: false,
    myCity: false,
  });

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <aside className="job-filters slide-in">
      <h3>Filters</h3>

      <select name="profile" onChange={handleChange}>
        <option value="">Profile</option>
        <option value="Frontend Developer">Frontend</option>
        <option value="Backend Developer">Backend</option>
        <option value="Full Stack Developer">Full Stack</option>
      </select>

      <select name="location" onChange={handleChange}>
        <option value="">Location</option>
        <option value="Remote">Remote</option>
        <option value="Bangalore">Bangalore</option>
        <option value="Delhi">Delhi</option>
      </select>

      <select name="experience" onChange={handleChange}>
        <option value="">Experience</option>
        <option value="0-1">0–1 yrs</option>
        <option value="2-3">2–3 yrs</option>
      </select>

      <select name="salary" onChange={handleChange}>
        <option value="">Salary</option>
        <option value="3-6">₹3–6 LPA</option>
        <option value="6-10">₹6–10 LPA</option>
        <option value="10+">₹10+ LPA</option>
      </select>

      <label>
        <input type="checkbox" name="remote" onChange={handleChange} />
        Work from home
      </label>

      <label>
        <input type="checkbox" name="partTime" onChange={handleChange} />
        Part time
      </label>

      <button onClick={() => onApply(filters)}>Apply Filters</button>
    </aside>
  );
}
