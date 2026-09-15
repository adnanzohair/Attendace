import { useEffect, useState } from "react";
import { CalendarPlus, Send } from "lucide-react";
import { api, messageOf } from "../../services/api";
import { Empty, Spinner, StatusBadge } from "../../components/ui";
import { leaveStatusLabel, leaveTypeLabel } from "../../utils/leaveRequestPresentation";

const dateKey = (date = new Date()) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
const blank = () => ({ requestedType: "casual", startDate: dateKey(), endDate: dateKey(), reason: "" });

export default function MyLeave() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/employee-portal/leave-requests");
      setItems(data.data || []);
    } catch (requestError) {
      setError(messageOf(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { data } = await api.post("/employee-portal/leave-requests", form);
      setNotice(data.message);
      setForm(blank());
      await load();
    } catch (requestError) {
      setError(messageOf(requestError));
    } finally {
      setBusy(false);
    }
  }

  return <>
    <div className="mb-5">
      <h2 className="page-title">My leave</h2>
      <p className="muted mt-1">Request planned time off and track HR approval. Weekends and company holidays are excluded automatically.</p>
    </div>

    <form className="card grid gap-4 p-5 md:grid-cols-2" onSubmit={submit}>
      <div className="md:col-span-2 flex items-center gap-2 font-bold text-ink"><CalendarPlus size={19}/> New leave request</div>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 md:col-span-2">{error}</div>}
      {notice && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 md:col-span-2">{notice}</div>}
      <label><span className="label">Leave type</span><select className="field" value={form.requestedType} onChange={(event) => setForm({ ...form, requestedType: event.target.value })}><option value="casual">Casual Leave</option><option value="sick">Sick Leave</option><option value="other">Other Leave</option></select></label>
      <div className="hidden md:block"/>
      <label><span className="label">Start date</span><input className="field" type="date" min={dateKey()} value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value, endDate: event.target.value > form.endDate ? event.target.value : form.endDate })} required/></label>
      <label><span className="label">End date</span><input className="field" type="date" min={form.startDate} value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} required/></label>
      <label className="md:col-span-2"><span className="label">Reason</span><textarea className="field min-h-28" maxLength="1000" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder="Explain why you need this leave" required/></label>
      <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">Available Sick or Casual Leave is paid. HR may classify other or excess leave as unpaid.</p><button className="btn-primary" disabled={busy}><Send size={17}/>{busy ? "Submitting…" : "Submit request"}</button></div>
    </form>

    <section className="card mt-5">
      <div className="border-b p-5"><h3 className="font-bold">Request history</h3></div>
      {loading ? <div className="p-8"><Spinner/></div> : items.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Requested</th><th>Dates</th><th>Reason</th><th>Status</th><th>HR treatment</th><th>HR note</th></tr></thead><tbody>{items.map((item) => <tr key={item._id}><td>{leaveTypeLabel(item.requestedType)}</td><td className="whitespace-nowrap">{item.startDate}<br/><span className="text-xs text-slate-400">through {item.endDate}</span></td><td className="min-w-56 whitespace-normal">{item.reason}</td><td><StatusBadge value={leaveStatusLabel(item.status)}/></td><td>{item.approvedType ? leaveTypeLabel(item.approvedType) : "—"}</td><td className="min-w-44 whitespace-normal">{item.adminNote || "—"}</td></tr>)}</tbody></table></div> : <Empty text="You have not submitted any leave requests."/>}
    </section>
  </>;
}
