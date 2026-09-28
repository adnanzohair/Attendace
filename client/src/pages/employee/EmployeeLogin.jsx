import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useEmployeeAuth } from "../../context/EmployeeAuthContext";
import { messageOf } from "../../services/api";
import AuthShell from "../../components/AuthShell";

export default function EmployeeLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useEmployeeAuth();
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      navigate("/employee/dashboard");
    } catch (requestError) {
      setError(messageOf(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      variant="employee"
      eyebrow="Employee Portal"
      title="Employee Portal"
      subtitle="Sign in with your registered work email to view your attendance, leave, and payslips."
    >
      <form onSubmit={submit} className="space-y-5">
        {error && (
          <div className="alert-error">
            <AlertCircle size={17} className="mt-px shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="label" htmlFor="employee-email">
            Email
          </label>
          <input
            id="employee-email"
            className="field"
            type="email"
            autoComplete="username"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="employee-password">
            Password
          </label>
          <input
            id="employee-password"
            className="field"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <button className="btn-primary w-full py-2.5" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
          {!busy && <ArrowRight size={16} />}
        </button>
      </form>

      <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-5 text-sm">
        <Link to="/login" className="link">
          Admin/HR login
        </Link>
        <Link to="/employee/forgot-password" className="link">
          Forgot password?
        </Link>
      </div>
    </AuthShell>
  );
}
