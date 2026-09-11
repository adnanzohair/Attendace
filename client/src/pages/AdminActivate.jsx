import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppFooter from "../components/AppFooter";
import { api, messageOf } from "../services/api";

export default function AdminActivate() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault(); setError("");
    if (password !== confirmPassword) return setError("Passwords do not match");
    setBusy(true);
    try {
      await api.post("/auth/activate-admin", { token, password });
      navigate("/login", { replace: true });
    } catch (requestError) {
      setError(messageOf(requestError));
    } finally {
      setBusy(false);
    }
  }

  return <div className="flex min-h-screen flex-col bg-ink"><div className="grid flex-1 place-items-center p-4"><form className="card w-full max-w-md p-8" onSubmit={submit}><h1 className="text-2xl font-bold">Activate administrator account</h1><p className="muted mb-6 mt-2">Create a private password with at least 10 characters.</p>{error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</div>}<label><span className="label">Password</span><input className="field mb-4" type="password" minLength="10" value={password} onChange={(event) => setPassword(event.target.value)} required/></label><label><span className="label">Confirm password</span><input className="field mb-4" type="password" minLength="10" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required/></label><button className="btn-primary w-full" disabled={busy}>{busy ? "Activating…" : "Create password"}</button><Link className="mt-4 block text-center text-sm text-brand-700" to="/login">Back to login</Link></form></div><AppFooter dark/></div>;
}
