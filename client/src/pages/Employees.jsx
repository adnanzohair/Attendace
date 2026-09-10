import { useEffect, useState } from "react";
import { Eye, MailPlus, Pencil, Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { api, messageOf } from "../services/api";
import { Empty, Modal, StatusBadge } from "../components/ui";

const blank = { employeeId: "", name: "", fatherName: "", designation: "", department: "", joiningDate: "", phone: "", email: "", status: "active", monthlySalary: 0, salaryCurrency: "PKR", payrollSettings: { lateDeductionOverride: "inherit", overtimeEligible: false }, leavePolicy: { sickGranted: 0, casualGranted: 0 } };
const editableFields = ["employeeId", "name", "fatherName", "designation", "department", "joiningDate", "phone", "email", "status", "monthlySalary", "salaryCurrency", "payrollSettings", "leavePolicy"];
const formEmployee = (employee) => ({ ...structuredClone(blank), ...employee, joiningDate: employee.joiningDate?.slice(0, 10) || "", payrollSettings: { ...blank.payrollSettings, ...employee.payrollSettings }, leavePolicy: { ...blank.leavePolicy, ...employee.leavePolicy } });

export default function Employees() {
  const [data, setData] = useState([]), [search, setSearch] = useState(""), [edit, setEdit] = useState(null);
  const [error, setError] = useState(""), [notice, setNotice] = useState(""), [saving, setSaving] = useState(false);
  const load = () => api.get("/employees", { params: { search, limit: 500 } }).then((r) => setData(r.data.data)).catch((e) => setError(messageOf(e)));
  useEffect(() => { load(); }, []);

  async function save(event) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const payload = Object.fromEntries(editableFields.map((field) => [field, edit[field]]));
      payload.monthlySalary = Number(payload.monthlySalary || 0);
      edit._id ? await api.put(`/employees/${edit._id}`, payload) : await api.post("/employees", payload);
      setEdit(null); setNotice("Employee saved successfully."); await load();
    } catch (e) { setError(messageOf(e)); } finally { setSaving(false); }
  }

  async function invite(employee) {
    setSaving(true); setError(""); setNotice("");
    try {
      const { data: result } = await api.post(`/employees/${employee._id}/invite`);
      setNotice(result.message);
    } catch (requestError) {
      setError(messageOf(requestError));
    } finally {
      setSaving(false);
    }
  }

  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="page-title">Employees</h1><p className="muted mt-1">Manage employee details, salary and active status.</p></div><button className="btn-primary" onClick={() => { setError(""); setEdit(structuredClone(blank)); }}><Plus size={18}/>Add employee</button></div>
    {notice && <div className="mb-4 rounded-lg bg-green-50 p-3 text-green-700">{notice}</div>}
    {!edit && error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</div>}
    <div className="card"><form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex gap-2 border-b p-4"><div className="relative max-w-md flex-1"><Search className="absolute left-3 top-2.5 text-slate-400" size={18}/><input className="field pl-10" placeholder="Search name, ID, department…" value={search} onChange={(e) => setSearch(e.target.value)}/></div><button className="btn-secondary">Search</button></form>
      {data.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Employee</th><th>Enroll ID</th><th>Department</th><th>Designation</th><th>Monthly salary</th><th>Sick leave</th><th>Casual leave</th><th>Status</th><th></th></tr></thead><tbody>{data.map((x) => <tr key={x._id}><td className="font-semibold">{x.name}</td><td>{x.employeeId}</td><td>{x.department || "—"}</td><td>{x.designation || "—"}</td><td>{x.salaryCurrency || "PKR"} {Number(x.monthlySalary || 0).toLocaleString()}</td><td>{x.leaveUsage?.sickUsed || 0} used / {x.leavePolicy?.sickGranted || 0} granted</td><td>{x.leaveUsage?.casualUsed || 0} used / {x.leavePolicy?.casualGranted || 0} granted</td><td><StatusBadge value={x.status}/></td><td><div className="flex gap-2"><Link aria-label={`View ${x.name}`} title="View employee" className="p-1 text-slate-500" to={`/employees/${x._id}`}><Eye size={17}/></Link><button aria-label={`Edit ${x.name}`} title="Edit employee" type="button" className="p-1 text-slate-500" onClick={() => { setError(""); setEdit(formEmployee(x)); }}><Pencil size={17}/></button><button aria-label={`Invite ${x.name} to employee portal`} title={x.email ? "Send employee portal invitation" : "Add an email before inviting"} type="button" disabled={saving || x.status !== "active" || !x.email} className="p-1 text-brand-700 disabled:cursor-not-allowed disabled:text-slate-300" onClick={() => invite(x)}><MailPlus size={17}/></button></div></td></tr>)}</tbody></table></div> : <Empty/>}
    </div>
    {edit && <Modal title={edit._id ? "Edit employee" : "Add employee"} onClose={() => setEdit(null)}><form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
      {error && <div className="sm:col-span-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {[["employeeId", "Enroll ID"], ["name", "Full name"], ["fatherName", "Father name"], ["designation", "Designation"], ["department", "Department"], ["phone", "Phone"], ["email", "Email"]].map(([k, l]) => <label key={k}><span className="label">{l}</span><input className="field" value={edit[k] ?? ""} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} required={["employeeId", "name"].includes(k)}/></label>)}
      <label><span className="label">Joining date</span><input className="field" type="date" value={edit.joiningDate || ""} onChange={(e) => setEdit({ ...edit, joiningDate: e.target.value })}/></label>
      <label><span className="label">Monthly salary</span><input className="field" type="number" min="0" step="0.01" value={edit.monthlySalary ?? 0} onChange={(e) => setEdit({ ...edit, monthlySalary: e.target.value })}/></label>
      <label><span className="label">Salary currency</span><select className="field" value={edit.salaryCurrency || "PKR"} onChange={(e) => setEdit({ ...edit, salaryCurrency: e.target.value })}><option value="PKR">PKR — Pakistan Rupee</option><option value="USD">USD — US Dollar</option></select></label>
      <label><span className="label">Sick leaves granted yearly</span><input className="field" type="number" min="0" step="1" value={edit.leavePolicy?.sickGranted ?? 0} onChange={(e) => setEdit({ ...edit, leavePolicy: { ...edit.leavePolicy, sickGranted: e.target.value } })}/></label>
      <label><span className="label">Casual leaves granted yearly</span><input className="field" type="number" min="0" step="1" value={edit.leavePolicy?.casualGranted ?? 0} onChange={(e) => setEdit({ ...edit, leavePolicy: { ...edit.leavePolicy, casualGranted: e.target.value } })}/></label>
      <label><span className="label">Status</span><select className="field" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
      <label><span className="label">Late deduction</span><select className="field" value={edit.payrollSettings?.lateDeductionOverride || "inherit"} onChange={(e) => setEdit({ ...edit, payrollSettings: { ...edit.payrollSettings, lateDeductionOverride: e.target.value } })}><option value="inherit">Use global setting</option><option value="enabled">Enabled for employee</option><option value="disabled">Disabled for employee</option></select></label>
      <label className="flex items-center gap-2 self-end pb-2"><input type="checkbox" checked={Boolean(edit.payrollSettings?.overtimeEligible)} onChange={(e) => setEdit({ ...edit, payrollSettings: { ...edit.payrollSettings, overtimeEligible: e.target.checked } })}/><span className="text-sm">Eligible for paid overtime</span></label>
      <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" className="btn-secondary" onClick={() => setEdit(null)}>Cancel</button><button disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save employee"}</button></div>
    </form></Modal>}
  </>;
}
