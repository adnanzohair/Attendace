import { useEffect, useState } from "react";
import { Download, Eye, MailCheck, RefreshCw, RotateCcw, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Empty, Spinner, StatusBadge } from "../components/ui";
import { api, messageOf } from "../services/api";
import { currentPayrollMonth, payrollPeriodForMonth } from "../utils/payrollPeriod";
import { payrollRegisterParams } from "../utils/payrollRegisterParams";
import { payslipPeriodLabel } from "../utils/payslipPeriodLabel";
import { payrollDeductionBreakdown } from "../utils/payrollDeductionBreakdown";

const money = (value) => Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 2 });
const pdfUrl = (id, inline = false) => `/api/payslips/published/${encodeURIComponent(id)}/download${inline ? "?inline=1" : ""}`;

export default function Payroll() {
  const initialMonth = currentPayrollMonth();
  const initialPeriod = payrollPeriodForMonth(initialMonth);
  const [mode, setMode] = useState("month");
  const [month, setMonth] = useState(initialMonth);
  const [startDate, setStartDate] = useState(initialPeriod.startDate);
  const [endDate, setEndDate] = useState(initialPeriod.endDate);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ employeeCount: 0, payslipCount: 0, currencies: {} });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const params = payrollRegisterParams({ mode, month, startDate, endDate, search, status });
      const { data } = await api.get("/payslips/published", { params });
      setItems(data.data);
      setSummary(data.summary);
    } catch (requestError) {
      setError(messageOf(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function retryEmail(payslip) {
    setActionId(payslip._id); setError(""); setNotice("");
    try {
      const { data } = await api.post(`/payslips/published/${payslip._id}/retry-email`);
      setNotice(data.message);
      await load();
    } catch (requestError) {
      setError(messageOf(requestError));
    } finally {
      setActionId("");
    }
  }

  async function voidPayslip(payslip) {
    const reason = window.prompt("Reason for voiding this payslip:");
    if (!reason?.trim()) return;
    setActionId(payslip._id); setError(""); setNotice("");
    try {
      const { data } = await api.post(`/payslips/published/${payslip._id}/void`, { reason: reason.trim() });
      setNotice(data.message);
      if (selected?._id === payslip._id) setSelected(null);
      await load();
    } catch (requestError) {
      setError(messageOf(requestError));
    } finally {
      setActionId("");
    }
  }

  const currencyEntries = Object.entries(summary.currencies || {});
  return <>
    <div className="mb-6"><h1 className="page-title">Payroll Register</h1><p className="muted mt-1">Review immutable published payroll records and employee payslip delivery.</p></div>

    <form className="card mb-5 grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-6" onSubmit={(event) => { event.preventDefault(); load(); }}>
      <label><span className="label">Date selection</span><select className="field" value={mode} onChange={(event) => setMode(event.target.value)}><option value="month">Payroll month</option><option value="custom">Custom range</option></select></label>
      {mode === "month"
        ? <label><span className="label">Payroll month</span><input className="field" type="month" value={month} onChange={(event) => setMonth(event.target.value)}/></label>
        : <><label><span className="label">Start date</span><input className="field" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required/></label><label><span className="label">End date</span><input className="field" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required/></label></>}
      <label><span className="label">Employee</span><input className="field" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or ID"/></label>
      <label><span className="label">Status</span><select className="field" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All records</option><option value="published">Published</option><option value="email_failed">Email failed</option><option value="void">Voided</option></select></label>
      <button className="btn-primary self-end" disabled={loading}><RefreshCw size={16}/>{loading ? "Loading…" : "Load payroll"}</button>
    </form>

    {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</div>}
    {notice && <div className="mb-4 rounded-lg bg-green-50 p-3 text-green-800">{notice}</div>}

    <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Summary label="Employees paid" value={summary.employeeCount}/>
      <Summary label="Active payslips" value={summary.payslipCount}/>
      {currencyEntries.map(([currency, totals]) => <div className="card p-5" key={currency}><div className="mb-2 font-bold text-ink">{currency} payroll</div><div className="grid grid-cols-3 gap-2 text-sm"><Amount label="Gross" value={totals.gross}/><Amount label="Deductions" value={totals.deductions}/><Amount label="Net" value={totals.net}/></div></div>)}
    </div>

    <div className="card overflow-hidden">
      {loading ? <div className="p-10"><Spinner/></div> : items.length ? <div className="table-wrap"><table className="table min-w-[2200px]"><thead><tr><th>Employee</th><th>Payroll period</th><th>Gross</th><th>Income tax</th><th>Short hours</th><th>Late</th><th>Excess leave</th><th>Personal loan</th><th>Advance salary</th><th>EOBI</th><th>PF</th><th>Professional tax</th><th>Other</th><th>Total deductions</th><th>Net salary</th><th>Published</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {items.map((payslip) => { const deductions = payrollDeductionBreakdown(payslip.data?.deductions); return <tr key={payslip._id}>
          <td><div className="font-semibold">{payslip.data?.employee?.name || "Employee"}</div><div className="muted">ID {payslip.employeeId}</div></td>
          <td>{payslipPeriodLabel(payslip.periodStart, payslip.periodEnd)}</td>
          <td>{payslip.currency} {money(payslip.data?.earnings?.totalEarnings)}</td>
          <DeductionCell currency={payslip.currency} value={deductions.incomeTax}/>
          <DeductionCell currency={payslip.currency} value={deductions.shortHours}/>
          <DeductionCell currency={payslip.currency} value={deductions.lateArrival}/>
          <DeductionCell currency={payslip.currency} value={deductions.excessLeave}/>
          <DeductionCell currency={payslip.currency} value={deductions.personalLoan}/>
          <DeductionCell currency={payslip.currency} value={deductions.advanceSalary}/>
          <DeductionCell currency={payslip.currency} value={deductions.eobi}/>
          <DeductionCell currency={payslip.currency} value={deductions.providentFund}/>
          <DeductionCell currency={payslip.currency} value={deductions.professionalTax}/>
          <DeductionCell currency={payslip.currency} value={deductions.other}/>
          <DeductionCell currency={payslip.currency} value={deductions.total} strong/>
          <td className="font-semibold">{payslip.currency} {money(payslip.netSalary)}</td>
          <td>{payslip.publishedAt ? new Date(payslip.publishedAt).toLocaleDateString("en-GB") : "—"}</td>
          <td><StatusBadge value={payslip.delivery?.status || "pending"}/></td>
          <td><StatusBadge value={payslip.status}/>{payslip.voidReason && <div className="mt-1 max-w-44 text-xs text-slate-500" title={payslip.voidReason}>{payslip.voidReason}</div>}</td>
          <td><div className="flex flex-wrap gap-1">
            <button type="button" title="View payslip" className="p-1.5 text-slate-600" onClick={() => setSelected(payslip)}><Eye size={17}/></button>
            <a title="Download PDF" className="p-1.5 text-brand-700" href={pdfUrl(payslip._id)}><Download size={17}/></a>
            {payslip.status === "published" && payslip.delivery?.status === "failed" && <button type="button" title="Retry email" disabled={actionId === payslip._id} className="p-1.5 text-brand-700" onClick={() => retryEmail(payslip)}><MailCheck size={17}/></button>}
            {payslip.status === "published" && <button type="button" title="Void payslip" disabled={actionId === payslip._id} className="p-1.5 text-red-600" onClick={() => voidPayslip(payslip)}><X size={17}/></button>}
            {payslip.status === "void" && <Link title="Generate replacement" className="p-1.5 text-brand-700" to="/payslips"><RotateCcw size={17}/></Link>}
          </div></td>
        </tr>; })}
      </tbody></table></div> : <Empty text="No payroll records match these filters."/>}
    </div>

    {selected && <div className="fixed inset-0 z-50 bg-slate-950/60 p-3 md:p-8"><div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"><div className="flex items-center justify-between gap-3 border-b p-3"><div><b>{selected.data?.employee?.name}</b><div className="muted">{payslipPeriodLabel(selected.periodStart, selected.periodEnd)}</div></div><button type="button" className="btn-secondary" onClick={() => setSelected(null)}><X size={17}/> Close</button></div><iframe className="min-h-0 flex-1" src={pdfUrl(selected._id, true)} title={`Payslip for ${selected.data?.employee?.name}`}/></div></div>}
  </>;
}

function Summary({ label, value }) { return <div className="card p-5"><div className="text-2xl font-bold text-brand-700">{value}</div><div className="muted mt-1">{label}</div></div>; }
function Amount({ label, value }) { return <div><div className="text-xs text-slate-500">{label}</div><b>{money(value)}</b></div>; }
function DeductionCell({ currency, value, strong = false }) { return <td className={strong ? "font-bold" : ""}>{value ? `${currency} ${money(value)}` : "—"}</td>; }
