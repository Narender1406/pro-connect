import api from "./axios";

export const getFeed = async () => {
  const res = await api.get("/posts");
  return res.data;
};

export const createPost = async (data: { content: string }) => {
  const res = await api.post("/posts", data);
  return res.data;
};
