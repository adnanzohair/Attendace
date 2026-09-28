import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { api, messageOf } from "../../services/api";
import AuthShell from "../../components/AuthShell";

function PasswordForm({ reset = false }) {
  const { token } = useParams(),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      await api.post(`/employee-portal/auth/${reset ? "reset-password" : "activate"}`, {
        token,
        password,
      });
      navigate("/employee/login");
    } catch (x) {
      setError(messageOf(x));
    }
  }

  return (
    <AuthShell
      variant="employee"
      eyebrow="Employee Portal"
      title={reset ? "Reset password" : "Create your password"}
      subtitle="Choose a password with at least 10 characters."
    >
      <form onSubmit={submit} className="space-y-5">
        {error && (
          <div className="alert-error">
            <AlertCircle size={17} className="mt-px shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="label" htmlFor="portal-password">
            New password
          </label>
          <input
            id="portal-password"
            className="field"
            type="password"
            minLength="10"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <p className="hint">Minimum 10 characters.</p>
        </div>

        <button className="btn-primary w-full py-2.5">Save password</button>
      </form>

      <div className="mt-8 border-t border-slate-200 pt-5 text-center">
        <Link className="link text-sm" to="/employee/login">
          Back to login
        </Link>
      </div>
    </AuthShell>
  );
}

export const EmployeeActivate = () => <PasswordForm />;
export const EmployeeResetPassword = () => <PasswordForm reset />;

export function EmployeeForgotPassword() {
  const [email, setEmail] = useState(""),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/employee-portal/auth/forgot-password", { email });
      setNotice(data.message);
    } catch (x) {
      setError(messageOf(x));
    }
  }

  return (
    <AuthShell
      variant="employee"
      eyebrow="Employee Portal"
      title="Reset password"
      subtitle="We will send a secure link if your email is registered."
    >
      <form onSubmit={submit} className="space-y-5">
        {notice && (
          <div className="alert-success">
            <CheckCircle2 size={17} className="mt-px shrink-0" />
            <span>{notice}</span>
          </div>
        )}
        {error && (
          <div className="alert-error">
            <AlertCircle size={17} className="mt-px shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="label" htmlFor="forgot-email">
            Email
          </label>
          <input
            id="forgot-email"
            className="field"
            type="email"
            autoComplete="username"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <button className="btn-primary w-full py-2.5">Send reset link</button>
      </form>

      <div className="mt-8 border-t border-slate-200 pt-5 text-center">
        <Link className="link text-sm" to="/employee/login">
          Back to login
        </Link>
      </div>
    </AuthShell>
  );
}
