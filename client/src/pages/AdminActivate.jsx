import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import AuthShell from "../components/AuthShell";
import { api, messageOf } from "../services/api";

export default function AdminActivate() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
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

  return (
    <AuthShell
      eyebrow="Administrator invitation"
      title="Activate your account"
      subtitle="Create a private password with at least 10 characters."
    >
      <form className="space-y-5" onSubmit={submit}>
        {error && (
          <div className="alert-error">
            <AlertCircle size={17} className="mt-px shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="label" htmlFor="new-password">
            Password
          </label>
          <input
            id="new-password"
            className="field"
            type="password"
            minLength="10"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="confirm-password">
            Confirm password
          </label>
          <input
            id="confirm-password"
            className="field"
            type="password"
            minLength="10"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
          <p className="hint">Minimum 10 characters. Never share this password.</p>
        </div>

        <button className="btn-primary w-full py-2.5" disabled={busy}>
          {busy ? "Activating…" : "Create password"}
        </button>
      </form>

      <div className="mt-8 border-t border-slate-200 pt-5 text-center">
        <Link className="link text-sm" to="/login">
          Back to login
        </Link>
      </div>
    </AuthShell>
  );
}
