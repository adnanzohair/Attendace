import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api";
const Context = createContext();
export function EmployeeAuthProvider({ children }) {
  const [employee, setEmployee] = useState(null), [loading, setLoading] = useState(true);
  useEffect(() => { api.get("/employee-portal/auth/me").then(({ data }) => setEmployee(data.employee)).catch(() => setEmployee(null)).finally(() => setLoading(false)); }, []);
  const login = async (email, password) => { const { data } = await api.post("/employee-portal/auth/login", { email, password }); setEmployee(data.employee); };
  const logout = async () => { await api.post("/employee-portal/auth/logout"); setEmployee(null); };
  return <Context.Provider value={{ employee, loading, login, logout }}>{children}</Context.Provider>;
}
export const useEmployeeAuth = () => useContext(Context);
