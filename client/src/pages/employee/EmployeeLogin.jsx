import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEmployeeAuth } from "../../context/EmployeeAuthContext";
import { messageOf } from "../../services/api";
import AppFooter from "../../components/AppFooter";

export default function EmployeeLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useEmployeeAuth();
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    try { await login(email, password); navigate("/employee/dashboard"); }
    catch (requestError) { setError(messageOf(requestError)); }
    finally { setBusy(false); }
  }

  return <div className="flex min-h-screen flex-col bg-ink">
    <div className="grid flex-1 place-items-center p-4"><form onSubmit={submit} className="card w-full max-w-md p-8"><h1 className="text-2xl font-bold">Employee Portal</h1><p className="muted mb-6 mt-2">Sign in with your registered work email.</p>{error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</div>}<label className="label">Email</label><input className="field mb-4" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required/><label className="label">Password</label><input className="field mb-4" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required/><button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button><div className="mt-5 flex justify-between text-sm"><Link to="/login" className="text-brand-700">Admin/HR login</Link><Link to="/employee/forgot-password" className="text-brand-700">Forgot password?</Link></div></form></div>
    <AppFooter/>
  </div>;
}
