import api from "./axios";

export const getFeed = async () => {
  const res = await api.get("/posts");
  return res.data;
};

export const createPost = async ( content: string ) => {
  const res = await api.post("/posts", {content});
  return res.data;
};
