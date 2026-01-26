export const api = async (path: string, options: any = {}) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`http://localhost:5000/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : ""
    }
  });

  
  return res.json();
};
