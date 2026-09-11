import { useEffect, useState } from "react";
import { MailPlus, Power, RefreshCw, UserRoundCheck } from "lucide-react";
import { Empty, Spinner, StatusBadge } from "../components/ui";
import { api, messageOf } from "../services/api";
import { adminUserStatus } from "../utils/adminUserStatus";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    try { const { data } = await api.get("/admin-users"); setUsers(data.data); setError(""); }
    catch (requestError) { setError(messageOf(requestError)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function invite(event) {
    event.preventDefault(); setBusy("invite"); setError(""); setNotice("");
    try {
      const { data } = await api.post("/admin-users/invite", form);
      setNotice(data.message); setForm({ name: "", email: "" }); await load();
    } catch (requestError) { setError(messageOf(requestError)); }
    finally { setBusy(""); }
  }

  async function action(user, operation) {
    if (operation === "deactivate" && !window.confirm(`Deactivate ${user.name}? Their access will stop immediately.`)) return;
    setBusy(user.id); setError(""); setNotice("");
    try {
      const method = operation === "deactivate" ? "patch" : "post";
      const { data } = await api[method](`/admin-users/${user.id}/${operation}`);
      setNotice(data.message); await load();
    } catch (requestError) { setError(messageOf(requestError)); }
    finally { setBusy(""); }
  }

  return <>
    <div className="mb-6"><h1 className="page-title">Admin Users</h1><p className="muted mt-1">Invite trusted administrators without sharing your Owner password.</p></div>
    <form className="card mb-5 grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto]" onSubmit={invite}><label><span className="label">Administrator name</span><input className="field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required/></label><label><span className="label">Work email</span><input className="field" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required/></label><button className="btn-primary self-end" disabled={busy === "invite"}><MailPlus size={17}/>{busy === "invite" ? "Sending…" : "Send invitation"}</button></form>
    {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</div>}
    {notice && <div className="mb-4 rounded-lg bg-green-50 p-3 text-green-800">{notice}</div>}
    <div className="card overflow-hidden">{loading ? <div className="p-10"><Spinner/></div> : users.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Administrator</th><th>Role</th><th>Status</th><th>Invitation expires</th><th>Last login</th><th>Actions</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><div className="font-semibold">{user.name}</div><div className="muted">{user.email}</div></td><td className="capitalize">{user.role}</td><td><StatusBadge value={adminUserStatus(user)}/></td><td>{user.invitationPending && user.inviteExpiresAt ? new Date(user.inviteExpiresAt).toLocaleString() : "—"}</td><td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}</td><td><div className="flex gap-2">{user.role !== "owner" && user.invitationPending && <button title="Resend invitation" disabled={busy === user.id} className="p-1.5 text-brand-700" onClick={() => action(user, "resend")}><RefreshCw size={17}/></button>}{user.role !== "owner" && user.active && <button title="Deactivate administrator" disabled={busy === user.id} className="p-1.5 text-red-600" onClick={() => action(user, "deactivate")}><Power size={17}/></button>}{user.role !== "owner" && !user.active && !user.invitationPending && <button title="Reactivate with invitation" disabled={busy === user.id} className="p-1.5 text-brand-700" onClick={() => action(user, "reactivate")}><UserRoundCheck size={17}/></button>}</div></td></tr>)}</tbody></table></div> : <Empty text="No administrator accounts found."/>}</div>
  </>;
}
