import { useState } from "react";
import "./Projects.css";

interface Project {
  id: number;
  title: string;
  description: string;
  tech: string[];
  link?: string;
}

export default function Projects() {
  const [projects] = useState<Project[]>([
    {
      id: 1,
      title: "CareerTrack Platform",
      description:
        "A professional career tracking platform with authentication, feed, jobs, and project showcase.",
      tech: ["React", "TypeScript", "Node.js", "MongoDB"],
      link: "https://github.com",
    },
    {
      id: 2,
      title: "Job Portal App",
      description:
        "A job listing and application portal with recruiter and candidate roles.",
      tech: ["React", "Express", "MongoDB"],
    },
    {
      id: 3,
      title: "Portfolio Website",
      description:
        "Personal portfolio website to showcase skills, projects, and experience.",
      tech: ["HTML", "CSS", "JavaScript"],
    },
  ]);

  return (
    <div className="projects-page">
      <h1 className="page-title">Projects</h1>
      <p className="page-subtitle">
        Showcase your work and highlight your skills 🚀
      </p>

      <div className="projects-grid">
        {projects.map((project) => (
          <div key={project.id} className="project-card">
            <h3>{project.title}</h3>
            <p className="description">{project.description}</p>

            <div className="tech-stack">
              {project.tech.map((tech, index) => (
                <span key={index} className="tech-badge">
                  {tech}
                </span>
              ))}
            </div>

            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="project-link"
              >
                View Project →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
