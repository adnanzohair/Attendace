import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { messageOf } from "../services/api";
import AppFooter from "../components/AppFooter";
import { Link } from "react-router-dom";
export default function Login() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    { login } = useAuth(),
    nav = useNavigate();
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      nav("/dashboard");
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <div className="grid flex-1 place-items-center p-4">
      <form onSubmit={submit} className="card w-full max-w-md p-8">
        <div className="mb-8">
          <div className="text-2xl font-bold text-ink">Welcome to Attendly</div>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage employee attendance.
          </p>
        </div>
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <label className="label">Email</label>
        <input
          className="field mb-4"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label className="label">Password</label>
        <input
          className="field mb-6"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <div className="mt-5 text-center"><Link to="/employee/login" className="text-sm font-semibold text-brand-700">Employee Portal Login →</Link></div>
      </form>
      </div>
      <AppFooter dark />
    </div>
  );
}
