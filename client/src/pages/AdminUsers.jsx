import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, MailPlus, Power, RefreshCw, UserRoundCheck } from "lucide-react";
import { Empty, PageHeader, Spinner, StatusBadge } from "../components/ui";
import { api, messageOf } from "../services/api";
import { adminUserStatus } from "../utils/adminUserStatus";

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "—";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/admin-users");
      setUsers(data.data);
      setError("");
    } catch (requestError) {
      setError(messageOf(requestError));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function invite(event) {
    event.preventDefault();
    setBusy("invite");
    setError("");
    setNotice("");
    try {
      const { data } = await api.post("/admin-users/invite", form);
      setNotice(data.message);
      setForm({ name: "", email: "" });
      await load();
    } catch (requestError) {
      setError(messageOf(requestError));
    } finally {
      setBusy("");
    }
  }

  async function action(user, operation) {
    if (
      operation === "deactivate" &&
      !window.confirm(`Deactivate ${user.name}? Their access will stop immediately.`)
    )
      return;
    setBusy(user.id);
    setError("");
    setNotice("");
    try {
      const method = operation === "deactivate" ? "patch" : "post";
      const { data } = await api[method](`/admin-users/${user.id}/${operation}`);
      setNotice(data.message);
      await load();
    } catch (requestError) {
      setError(messageOf(requestError));
    } finally {
      setBusy("");
    }
  }

  return (
    <>
      <PageHeader
        title="Admin Users"
        subtitle="Invite trusted administrators without sharing your Owner password."
      />

      <form className="card mb-5" onSubmit={invite}>
        <div className="card-header">
          <h2 className="card-title">Invite an administrator</h2>
          <span className="eyebrow">Single-use · expires in 1 hour</span>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto]">
          <label>
            <span className="label">Administrator name</span>
            <input
              className="field"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </label>
          <label>
            <span className="label">Work email</span>
            <input
              className="field"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>
          <button className="btn-primary self-end" disabled={busy === "invite"}>
            <MailPlus size={16} />
            {busy === "invite" ? "Sending…" : "Send invitation"}
          </button>
        </div>
      </form>

      {error && (
        <div className="alert-error mb-4">
          <AlertCircle size={17} className="mt-px shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="alert-success mb-4">
          <CheckCircle2 size={17} className="mt-px shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner />
        ) : users.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Administrator</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Invitation expires</th>
                  <th>Last login</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-2xs font-bold text-slate-500">
                          {initials(user.name)}
                        </div>
                        <div className="min-w-0 leading-tight">
                          <div className="truncate font-medium text-ink">{user.name}</div>
                          <div className="truncate text-xs text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="chip capitalize">{user.role}</span>
                    </td>
                    <td>
                      <StatusBadge value={adminUserStatus(user)} />
                    </td>
                    <td className="text-slate-500">
                      {user.invitationPending && user.inviteExpiresAt
                        ? new Date(user.inviteExpiresAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="text-slate-500">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        {user.role !== "owner" && user.invitationPending && (
                          <button
                            title="Resend invitation"
                            disabled={busy === user.id}
                            className="btn-icon hover:bg-brand-50 hover:text-brand-700"
                            onClick={() => action(user, "resend")}
                          >
                            <RefreshCw size={16} />
                          </button>
                        )}
                        {user.role !== "owner" && user.active && (
                          <button
                            title="Deactivate administrator"
                            disabled={busy === user.id}
                            className="btn-icon-danger"
                            onClick={() => action(user, "deactivate")}
                          >
                            <Power size={16} />
                          </button>
                        )}
                        {user.role !== "owner" && !user.active && !user.invitationPending && (
                          <button
                            title="Reactivate with invitation"
                            disabled={busy === user.id}
                            className="btn-icon hover:bg-brand-50 hover:text-brand-700"
                            onClick={() => action(user, "reactivate")}
                          >
                            <UserRoundCheck size={16} />
                          </button>
                        )}
                        {user.role === "owner" && <span className="text-xs text-slate-300">—</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text="No administrator accounts found." />
        )}
      </div>
    </>
  );
}
