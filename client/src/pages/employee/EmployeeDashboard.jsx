import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, messageOf } from "../../services/api";
import { hours, Spinner } from "../../components/ui";

export default function EmployeeDashboard() {
  const [data, setData] = useState();
  const [error, setError] = useState("");
  useEffect(() => {
    api.get("/employee-portal/dashboard").then((response) => setData(response.data)).catch((requestError) => setError(messageOf(requestError)));
  }, []);
  if (error) return <div className="text-red-700">{error}</div>;
  if (!data) return <Spinner/>;

  const summary = data.summary;
  const cards = [
    ["Days present", summary.presentDays],
    ["Days absent", summary.absentDays],
    ["Late days", summary.lateDays],
    ["Short hours", hours(summary.shortMinutes)],
    ["Overtime", hours(summary.overtimeMinutes)],
    ["Sick leave remaining", summary.sickRemaining],
    ["Casual leave remaining", summary.casualRemaining],
  ];

  return <>
    <div className="mb-4"><h2 className="page-title">{data.period.label}</h2><p className="muted">{data.period.startDate} to {data.period.endDate}</p></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value]) => <div className="card p-5" key={label}><div className="text-2xl font-bold text-brand-700">{value}</div><div className="mt-1 text-sm text-slate-500">{label}</div></div>)}</div>
    <section className="card mt-5 p-5">
      <h3 className="text-lg font-bold">Latest published payslip</h3>
      {data.latestPayslip
        ? <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><div><b>{data.latestPayslip.periodStart} — {data.latestPayslip.periodEnd}</b><p className="muted">Net payable: {data.latestPayslip.currency} {Number(data.latestPayslip.netSalary).toLocaleString()}</p></div><Link className="btn-primary" to="/employee/payslips">View payslip</Link></div>
        : <p className="muted mt-2">HR has not published a payslip yet.</p>}
    </section>
  </>;
}
