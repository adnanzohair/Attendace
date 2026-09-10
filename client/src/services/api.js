import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.DEV ? (import.meta.env.VITE_API_URL || "http://localhost:5000/api") : "/api",
  withCredentials: true,
});
api.interceptors.response.use(
  (r) => r,
  (r) => {
    const sessionProbe = /\/auth\/me$/.test(r.config?.url || "");
    if (r.response?.status === 401 && !sessionProbe) {
      const target = location.pathname.startsWith("/employee") ? "/employee/login" : "/login";
      if (location.pathname !== target) location.href = target;
    }
    return Promise.reject(r);
  },
);
export const messageOf = (e) =>
  e.response?.data?.message ||
  (e.code === "ECONNABORTED"
    ? "The server did not respond in time"
    : e.message) ||
  "Something went wrong";
