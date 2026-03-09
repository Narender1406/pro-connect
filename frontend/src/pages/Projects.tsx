import { useState, useEffect } from "react";
import { showToast } from "../utils/toast";
import { userAPI } from "../api/user.api";
import "./Projects.css";

interface Project {
  _id?: string;
  title: string;
  description: string;
  techStack: string;
  liveUrl?: string;
  githubUrl?: string;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    techStack: "",
    liveUrl: "",
    githubUrl: "",
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data } = await userAPI.getProfile();
      setProjects(data.projects || []);
    } catch (error) {
      showToast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      showToast.error("Title and description are required");
      return;
    }

    try {
      const { data } = await userAPI.addProject(formData);
      setProjects(data.projects);
      setFormData({ title: "", description: "", techStack: "", liveUrl: "", githubUrl: "" });
      setShowForm(false);
      showToast.success("Project added successfully");
    } catch (error) {
      showToast.error("Failed to add project");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { data } = await userAPI.deleteProject(id);
      setProjects(data.projects);
      showToast.success("Project deleted");
    } catch (error) {
      showToast.error("Failed to delete project");
    }
  };

  if (loading) return <div className="projects-page"><p>Loading...</p></div>;

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div>
          <h1>Projects</h1>
          <p>Showcase your work and stand out from the crowd</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Project"}
        </button>
      </div>

      {showForm && (
        <form className="project-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Project Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Project Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            required
          />
          <input
            type="text"
            placeholder="Technologies (comma separated: React, Node.js, MongoDB)"
            value={formData.techStack}
            onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
          />
          <input
            type="url"
            placeholder="Live Demo URL (optional)"
            value={formData.liveUrl}
            onChange={(e) => setFormData({ ...formData, liveUrl: e.target.value })}
          />
          <input
            type="url"
            placeholder="GitHub URL (optional)"
            value={formData.githubUrl}
            onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
          />
          <button type="submit" className="btn-submit">Add Project</button>
        </form>
      )}

      <div className="projects-grid">
        {projects.map((project) => (
          <div key={project._id} className="project-card">
            <div className="project-header">
              <h3>{project.title}</h3>
              <button className="btn-delete" onClick={() => handleDelete(project._id!)}>×</button>
            </div>
            <p className="description">{project.description}</p>

            {project.techStack && (
              <div className="tech-stack">
                {project.techStack.split(",").map((tech, index) => (
                  <span key={index} className="tech-badge">{tech.trim()}</span>
                ))}
              </div>
            )}

            <div className="project-links">
              {project.liveUrl && (
                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="project-link">
                  Live Demo →
                </a>
              )}
              {project.githubUrl && (
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="project-link">
                  GitHub →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
