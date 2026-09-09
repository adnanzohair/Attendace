import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});
api.interceptors.response.use(
  (r) => r,
  (r) => {
    if (r.response?.status === 401 && location.pathname != "/login")
      location.href = "/login";
    return Promise.reject(r);
  },
);
export const messageOf = (e) =>
  e.response?.data?.message ||
  (e.code === "ECONNABORTED"
    ? "The server did not respond in time"
    : e.message) ||
  "Something went wrong";
