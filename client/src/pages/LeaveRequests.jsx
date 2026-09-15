import { useEffect, useState } from "react";
import { Check, Filter, X } from "lucide-react";
import { api, messageOf } from "../services/api";
import { Empty, Modal, Spinner, StatusBadge } from "../components/ui";
import { leaveStatusLabel, leaveTypeLabel } from "../utils/leaveRequestPresentation";

const initialFilters = { status: "pending", type: "", startDate: "", endDate: "" };

export default function LeaveRequests() {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load(nextFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const params = Object.fromEntries(Object.entries(nextFilters).filter(([, value]) => value));
      const { data } = await api.get("/leave-requests", { params });
      setItems(data.data || []);
    } catch (requestError) {
      setError(messageOf(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(initialFilters); }, []);

  function openDecision(request, action) {
    const defaultType = ["sick", "casual"].includes(request.requestedType) ? request.requestedType : "unpaid";
    setDecision({ request, action, approvedType: defaultType, adminNote: "" });
    setError("");
  }

  async function saveDecision(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = decision.action === "approve" ? { approvedType: decision.approvedType, adminNote: decision.adminNote } : { adminNote: decision.adminNote };
      const { data } = await api.post(`/leave-requests/${decision.request._id}/${decision.action}`, body);
      setNotice(data.message);
      setDecision(null);
      await load();
    } catch (requestError) {
      const details = requestError.response?.data?.details;
      const suffix = Array.isArray(details) ? ` ${details.map((item) => `${item.workDate}: ${item.reason}`).join("; ")}` : "";
      setError(`${messageOf(requestError)}${suffix}`);
    } finally {
      setBusy(false);
    }
  }

  return <>
    <div className="mb-6"><h1 className="page-title">Leave requests</h1><p className="muted mt-1">Review employee requests and choose the final paid or unpaid attendance treatment.</p></div>
    {notice && <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-emerald-700">{notice}</div>}
    {!decision && error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</div>}
    <div className="card">
      <form className="flex flex-wrap items-end gap-3 border-b p-4" onSubmit={(event) => { event.preventDefault(); load(); }}>
        <label><span className="label">Status</span><select className="field" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label>
        <label><span className="label">Requested type</span><select className="field" value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}><option value="">All types</option><option value="sick">Sick Leave</option><option value="casual">Casual Leave</option><option value="other">Other Leave</option></select></label>
        <label><span className="label">From</span><input className="field" type="date" value={filters.startDate} onChange={(event) => setFilters({ ...filters, startDate: event.target.value })}/></label>
        <label><span className="label">To</span><input className="field" type="date" min={filters.startDate} value={filters.endDate} onChange={(event) => setFilters({ ...filters, endDate: event.target.value })}/></label>
        <button className="btn-secondary"><Filter size={17}/>Apply filters</button>
      </form>
      {loading ? <div className="p-10"><Spinner/></div> : items.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Employee</th><th>Requested</th><th>Dates</th><th>Reason</th><th>Status</th><th>Final treatment</th><th>HR note</th><th>Action</th></tr></thead><tbody>{items.map((item) => <tr key={item._id}><td><b>{item.employee?.name || "Unknown employee"}</b><div className="text-xs text-slate-500">ID {item.employeeId}</div></td><td>{leaveTypeLabel(item.requestedType)}</td><td className="whitespace-nowrap">{item.startDate}<br/><span className="text-xs text-slate-400">through {item.endDate}</span></td><td className="min-w-56 whitespace-normal">{item.reason}</td><td><StatusBadge value={leaveStatusLabel(item.status)}/></td><td>{item.approvedType ? leaveTypeLabel(item.approvedType) : "—"}</td><td className="min-w-44 whitespace-normal">{item.adminNote || "—"}</td><td>{item.status === "pending" ? <div className="flex gap-2"><button className="btn-primary px-3 py-1.5" onClick={() => openDecision(item, "approve")}><Check size={16}/>Approve</button><button className="btn-secondary px-3 py-1.5 text-red-700" onClick={() => openDecision(item, "reject")}><X size={16}/>Reject</button></div> : "—"}</td></tr>)}</tbody></table></div> : <Empty text="No leave requests match these filters."/>}
    </div>

    {decision && <Modal title={decision.action === "approve" ? "Approve leave request" : "Reject leave request"} onClose={() => setDecision(null)}><form onSubmit={saveDecision}>
      <div className="rounded-lg bg-slate-50 p-4 text-sm"><b>{decision.request.employee?.name}</b> · ID {decision.request.employeeId}<div className="mt-1">{leaveTypeLabel(decision.request.requestedType)} · {decision.request.startDate} through {decision.request.endDate}</div><p className="mt-2 text-slate-600">{decision.request.reason}</p></div>
      {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {decision.action === "approve" && <label className="mt-4 block"><span className="label">Final attendance treatment</span><select className="field" value={decision.approvedType} onChange={(event) => setDecision({ ...decision, approvedType: event.target.value })}><option value="sick">Sick Leave (uses paid balance first)</option><option value="casual">Casual Leave (uses paid balance first)</option><option value="unpaid">Unpaid Leave (salary deduction)</option></select><span className="mt-1 block text-xs text-slate-500">Unused Sick/Casual entitlement is paid. Payroll deducts only excess entitlement or leave explicitly marked Unpaid.</span></label>}
      <label className="mt-4 block"><span className="label">{decision.action === "reject" ? "Rejection reason" : "HR note (optional)"}</span><textarea className="field min-h-24" maxLength="1000" value={decision.adminNote} onChange={(event) => setDecision({ ...decision, adminNote: event.target.value })} required={decision.action === "reject"}/></label>
      <div className="mt-5 flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setDecision(null)}>Cancel</button><button className={decision.action === "approve" ? "btn-primary" : "btn-secondary text-red-700"} disabled={busy}>{busy ? "Saving…" : decision.action === "approve" ? "Approve request" : "Reject request"}</button></div>
    </form></Modal>}
  </>;
}
