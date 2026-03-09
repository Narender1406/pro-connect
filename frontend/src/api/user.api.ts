import api from "./axios";

export const userAPI = {
  getProfile: () => api.get("/users/profile"),
  
  updateProfile: (data: any) => api.put("/users/profile", data),
  
  updateEmail: (email: string) => api.patch("/users/email", { email }),
  
  updatePassword: (currentPassword: string, newPassword: string) => 
    api.patch("/users/password", { currentPassword, newPassword }),
  
  updatePhone: (phone: string) => api.patch("/users/phone", { phone }),
  
  deleteAccount: () => api.delete("/users/account"),
  
  updateSettings: (settings: any) => api.patch("/users/settings", settings),
  
  addProject: (project: any) => api.post("/users/projects", project),
  
  deleteProject: (id: string) => api.delete(`/users/projects/${id}`),
  
  getAnalytics: () => api.get("/users/analytics"),
};
