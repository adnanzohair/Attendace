import { useEffect, useState } from "react";
import { api, messageOf } from "../../services/api";
import { hours, Spinner } from "../../components/ui";
import { currentPayrollMonth, payrollPeriodForMonth } from "../../utils/payrollPeriod";

const time = (value) => value
  ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  : "-";

export default function MyAttendance() {
  const initialMonth = currentPayrollMonth();
  const initialPeriod = payrollPeriodForMonth(initialMonth);
  const [data, setData] = useState();
  const [error, setError] = useState("");
  const [mode, setMode] = useState("month");
  const [payMonth, setPayMonth] = useState(initialMonth);
  const [startDate, setStart] = useState(initialPeriod.startDate);
  const [endDate, setEnd] = useState(initialPeriod.endDate);

  async function load() {
    try {
      const params = mode === "month" ? { month: payMonth } : { startDate, endDate };
      const response = await api.get("/employee-portal/attendance", { params });
      setData(response.data);
      setError("");
    } catch (requestError) {
      setError(messageOf(requestError));
    }
  }

  useEffect(() => { load(); }, []);

  return <>
    <div className="card mb-5 flex flex-wrap items-end gap-3 p-4">
      <label><span className="label">View by</span><select className="field" value={mode} onChange={(event) => setMode(event.target.value)}><option value="month">Payroll month</option><option value="custom">Custom range</option></select></label>
      {mode === "month"
        ? <label><span className="label">Payroll month</span><input className="field" type="month" value={payMonth} onChange={(event) => setPayMonth(event.target.value)}/><span className="mt-1 block text-xs text-slate-500">Runs from the previous month&apos;s 25th through this month&apos;s 25th.</span></label>
        : <><label><span className="label">Start date</span><input className="field" type="date" value={startDate} onChange={(event) => setStart(event.target.value)}/></label><label><span className="label">End date</span><input className="field" type="date" value={endDate} onChange={(event) => setEnd(event.target.value)}/></label></>}
      <button className="btn-primary" onClick={load}>View attendance</button>
    </div>
    {error && <div className="text-red-700">{error}</div>}
    {!data && !error ? <Spinner/> : data && <div className="card overflow-x-auto"><table className="w-full min-w-[950px] text-left text-sm"><thead><tr>{["Date", "Check-in", "Check-out", "Worked", "Required", "Short", "Overtime", "Late", "Early departure", "Status"].map((heading) => <th className="p-3" key={heading}>{heading}</th>)}</tr></thead><tbody>{data.records.map((record) => <tr className="border-t" key={record.id}><td className="p-3">{record.date}</td><td>{time(record.checkIn)}</td><td>{time(record.checkOut)}</td><td>{hours(record.totalMinutes)}</td><td>{hours(record.requiredMinutes)}</td><td>{hours(record.shortMinutes)}</td><td>{hours(record.overtimeMinutes)}</td><td>{hours(record.lateMinutes)}</td><td>{hours(record.earlyDepartureMinutes)}</td><td>{record.status}</td></tr>)}</tbody></table></div>}
  </>;
}
