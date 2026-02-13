import api from "./axios";

export const getFeed = async () => {
const token = localStorage.getItem("token");

  const res = await api.get("/posts" , {
    headers:{
      Authorization:`Bearer ${token}`,
    },
  });
  return res.data;
};

export const createPost = async ( content: string ) => {
  const token = localStorage.getItem("token");


  const res = await api.post("/posts", {content},
  {
    headers:{
      Authorization:`Bearer ${token}`,
    },
  }
);
  return res.data;
};
