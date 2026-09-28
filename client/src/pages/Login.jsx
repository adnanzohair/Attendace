import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { messageOf } from "../services/api";
import AuthShell from "../components/AuthShell";

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
    <AuthShell
      eyebrow="Admin & HR"
      title="Sign in to Attendly"
      subtitle="Manage employee attendance, leave, and payroll."
    >
      <form onSubmit={submit} className="space-y-5">
        {error && (
          <div className="alert-error">
            <AlertCircle size={17} className="mt-px shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="field"
            type="email"
            autoComplete="username"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="field"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="btn-primary w-full py-2.5" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
          {!busy && <ArrowRight size={16} />}
        </button>
      </form>

      <div className="mt-8 border-t border-slate-200 pt-5 text-center">
        <Link to="/employee/login" className="link text-sm">
          Employee Portal login →
        </Link>
      </div>
    </AuthShell>
  );
}
