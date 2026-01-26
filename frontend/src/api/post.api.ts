import axiosInstance from "./axios";
import { Post } from "../types/posts";

export const createPost = async (
  content: string,
  token: string
): Promise<Post> => {
  const response = await axiosInstance.post(
    "/api/posts",
    { content },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const fetchPosts = async (token: string): Promise<Post[]> => {
  const response = await axiosInstance.get("/api/posts", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
