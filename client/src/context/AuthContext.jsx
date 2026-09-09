import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api";
const C = createContext();
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => active && setLoading(false), 10000);
    api
      .get("/auth/me")
      .then((r) => active && setUser(r.data.user))
      .catch(() => active && setUser(null))
      .finally(() => {
        clearTimeout(timer);
        active && setLoading(false);
      });
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);
  const login = async (email, password) => {
      const { data } = await api.post("/auth/login", { email, password });
      setUser(data.user);
    },
    logout = async () => {
      await api.post("/auth/logout");
      setUser(null);
    };
  return (
    <C.Provider value={{ user, loading, login, logout }}>{children}</C.Provider>
  );
}
export const useAuth = () => useContext(C);
