import api from './api'

export const aiService = {
  chat: (message: string, history: Array<{ role: string; content: string }>) =>
    api.post('/ai/chat', { message, history }),
  reviewResume: (resume_url: string) =>
    api.post('/ai/resume-review', { resume_url }),
  writePost: (topic: string, tone?: string) =>
    api.post('/ai/write-post', { topic, tone }),
  summarizeMeeting: (transcript: string) =>
    api.post('/ai/meeting-summary', { transcript }),
  suggestTasks: (project_description: string) =>
    api.post('/ai/suggest-tasks', { project_description }),
  smartSearch: (query: string) =>
    api.get('/ai/search', { params: { q: query } }),
}
