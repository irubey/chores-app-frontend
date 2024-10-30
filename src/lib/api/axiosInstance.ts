import axios from "axios";
import { setupInterceptors } from "./interceptors";

// Create a singleton axios instance
export const axiosInstance = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Initialize interceptors after creating the axios instance
setupInterceptors(axiosInstance);
