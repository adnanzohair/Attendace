import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  MailCheck,
  RefreshCw,
  RotateCcw,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Empty, PageHeader, Spinner, StatusBadge } from "../components/ui";
import { api, messageOf } from "../services/api";
import { currentPayrollMonth, payrollPeriodForMonth } from "../utils/payrollPeriod";
import { payrollRegisterParams } from "../utils/payrollRegisterParams";
import { payslipPeriodLabel } from "../utils/payslipPeriodLabel";
import { payrollDeductionBreakdown } from "../utils/payrollDeductionBreakdown";

const money = (value) => Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 2 });
const pdfUrl = (id, inline = false) =>
  `/api/payslips/published/${encodeURIComponent(id)}/download${inline ? "?inline=1" : ""}`;

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
    setLoading(true);
    setError("");
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

  useEffect(() => {
    load();
  }, []);

  async function retryEmail(payslip) {
    setActionId(payslip._id);
    setError("");
    setNotice("");
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
    setActionId(payslip._id);
    setError("");
    setNotice("");
    try {
      const { data } = await api.post(`/payslips/published/${payslip._id}/void`, {
        reason: reason.trim(),
      });
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

  return (
    <>
      <PageHeader
        title="Payroll Register"
        subtitle="Review immutable published payroll records and employee payslip delivery."
      />

      <form
        className="card mb-5"
        onSubmit={(event) => {
          event.preventDefault();
          load();
        }}
      >
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-6">
          <label>
            <span className="label">Date selection</span>
            <select
              className="field"
              value={mode}
              onChange={(event) => setMode(event.target.value)}
            >
              <option value="month">Payroll month</option>
              <option value="custom">Custom range</option>
            </select>
          </label>
          {mode === "month" ? (
            <label>
              <span className="label">Payroll month</span>
              <input
                className="field"
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
              />
            </label>
          ) : (
            <>
              <label>
                <span className="label">Start date</span>
                <input
                  className="field"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  required
                />
              </label>
              <label>
                <span className="label">End date</span>
                <input
                  className="field"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  required
                />
              </label>
            </>
          )}
          <label>
            <span className="label">Employee</span>
            <input
              className="field"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name or ID"
            />
          </label>
          <label>
            <span className="label">Status</span>
            <select
              className="field"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">All records</option>
              <option value="published">Published</option>
              <option value="email_failed">Email failed</option>
              <option value="void">Voided</option>
            </select>
          </label>
          <button className="btn-primary self-end" disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "Loading…" : "Load payroll"}
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

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Summary label="Employees paid" value={summary.employeeCount} />
        <Summary label="Active payslips" value={summary.payslipCount} />
        {currencyEntries.map(([currency, totals]) => (
          <div className="card p-4" key={currency}>
            <div className="eyebrow">{currency} payroll</div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <Amount label="Gross" value={totals.gross} />
              <Amount label="Deductions" value={totals.deductions} />
              <Amount label="Net" value={totals.net} strong />
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner />
        ) : items.length ? (
          <div className="table-wrap">
            <table className="table min-w-[2200px]">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Payroll period</th>
                  <th className="text-right">Gross</th>
                  <th className="text-right">Income tax</th>
                  <th className="text-right">Short hours</th>
                  <th className="text-right">Late</th>
                  <th className="text-right">Excess leave</th>
                  <th className="text-right">Personal loan</th>
                  <th className="text-right">Advance salary</th>
                  <th className="text-right">EOBI</th>
                  <th className="text-right">PF</th>
                  <th className="text-right">Professional tax</th>
                  <th className="text-right">Other</th>
                  <th className="text-right">Total deductions</th>
                  <th className="text-right">Net salary</th>
                  <th>Published</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((payslip) => {
                  const deductions = payrollDeductionBreakdown(payslip.data?.deductions);
                  return (
                    <tr key={payslip._id}>
                      <td>
                        <div className="font-medium text-ink">
                          {payslip.data?.employee?.name || "Employee"}
                        </div>
                        <div className="text-xs text-slate-400">ID {payslip.employeeId}</div>
                      </td>
                      <td>{payslipPeriodLabel(payslip.periodStart, payslip.periodEnd)}</td>
                      <td className="text-right font-medium text-ink">
                        <span className="text-xs text-slate-400">{payslip.currency}</span>{" "}
                        {money(payslip.data?.earnings?.totalEarnings)}
                      </td>
                      <DeductionCell currency={payslip.currency} value={deductions.incomeTax} />
                      <DeductionCell currency={payslip.currency} value={deductions.shortHours} />
                      <DeductionCell currency={payslip.currency} value={deductions.lateArrival} />
                      <DeductionCell currency={payslip.currency} value={deductions.excessLeave} />
                      <DeductionCell currency={payslip.currency} value={deductions.personalLoan} />
                      <DeductionCell currency={payslip.currency} value={deductions.advanceSalary} />
                      <DeductionCell currency={payslip.currency} value={deductions.eobi} />
                      <DeductionCell
                        currency={payslip.currency}
                        value={deductions.providentFund}
                      />
                      <DeductionCell
                        currency={payslip.currency}
                        value={deductions.professionalTax}
                      />
                      <DeductionCell currency={payslip.currency} value={deductions.other} />
                      <DeductionCell
                        currency={payslip.currency}
                        value={deductions.total}
                        strong
                      />
                      <td className="text-right font-semibold text-ink">
                        <span className="text-xs font-normal text-slate-400">
                          {payslip.currency}
                        </span>{" "}
                        {money(payslip.netSalary)}
                      </td>
                      <td className="text-slate-500">
                        {payslip.publishedAt
                          ? new Date(payslip.publishedAt).toLocaleDateString("en-GB")
                          : "—"}
                      </td>
                      <td>
                        <StatusBadge value={payslip.delivery?.status || "pending"} />
                      </td>
                      <td>
                        <StatusBadge value={payslip.status} />
                        {payslip.voidReason && (
                          <div
                            className="mt-1 max-w-44 truncate text-xs text-slate-400"
                            title={payslip.voidReason}
                          >
                            {payslip.voidReason}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-wrap justify-end gap-1">
                          <button
                            type="button"
                            title="View payslip"
                            className="btn-icon"
                            onClick={() => setSelected(payslip)}
                          >
                            <Eye size={16} />
                          </button>
                          <a
                            title="Download PDF"
                            className="btn-icon hover:bg-brand-50 hover:text-brand-700"
                            href={pdfUrl(payslip._id)}
                          >
                            <Download size={16} />
                          </a>
                          {payslip.status === "published" &&
                            payslip.delivery?.status === "failed" && (
                              <button
                                type="button"
                                title="Retry email"
                                disabled={actionId === payslip._id}
                                className="btn-icon hover:bg-brand-50 hover:text-brand-700"
                                onClick={() => retryEmail(payslip)}
                              >
                                <MailCheck size={16} />
                              </button>
                            )}
                          {payslip.status === "published" && (
                            <button
                              type="button"
                              title="Void payslip"
                              disabled={actionId === payslip._id}
                              className="btn-icon-danger"
                              onClick={() => voidPayslip(payslip)}
                            >
                              <X size={16} />
                            </button>
                          )}
                          {payslip.status === "void" && (
                            <Link
                              title="Generate replacement"
                              className="btn-icon hover:bg-brand-50 hover:text-brand-700"
                              to="/payslips"
                            >
                              <RotateCcw size={16} />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text="No payroll records match these filters." />
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 animate-fade-in bg-slate-900/60 p-3 backdrop-blur-[2px] md:p-8">
          <div className="mx-auto flex h-full max-w-5xl animate-scale-in flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
              <div className="min-w-0 leading-tight">
                <div className="truncate text-sm font-semibold text-ink">
                  {selected.data?.employee?.name}
                </div>
                <div className="truncate text-xs text-slate-500">
                  {payslipPeriodLabel(selected.periodStart, selected.periodEnd)}
                </div>
              </div>
              <button type="button" className="btn-secondary btn-sm" onClick={() => setSelected(null)}>
                <X size={15} /> Close
              </button>
            </div>
            <iframe
              className="min-h-0 flex-1 bg-slate-100"
              src={pdfUrl(selected._id, true)}
              title={`Payslip for ${selected.data?.employee?.name}`}
            />
          </div>
        </div>
      )}
    </>
  );
}

function Summary({ label, value }) {
  return (
    <div className="card p-4">
      <div className="text-2xl font-semibold leading-none tracking-tightest text-brand-700">
        {value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function Amount({ label, value, strong = false }) {
  return (
    <div>
      <div className="text-2xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-0.5 text-sm ${strong ? "font-semibold text-ink" : "font-medium text-slate-600"}`}>
        {money(value)}
      </div>
    </div>
  );
}

function DeductionCell({ currency, value, strong = false }) {
  return (
    <td className={`text-right ${strong ? "font-semibold text-ink" : ""}`}>
      {value ? (
        <>
          <span className="text-xs font-normal text-slate-400">{currency}</span> {money(value)}
        </>
      ) : (
        <span className="text-slate-300">—</span>
      )}
    </td>
  );
}
