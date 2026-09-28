import { useEffect, useState } from "react";
import { Download, Info, Lock } from "lucide-react";
import { api } from "../services/api";
import { Empty, hours, PageHeader } from "../components/ui";

function defaults() {
  const n = new Date(),
    s = new Date(n.getFullYear(), n.getMonth(), 25),
    e = new Date(n.getFullYear(), n.getMonth() + 1, 25),
    key = (d) =>
      [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
  return [key(s), key(e)];
}

export default function Monthly() {
  const initial = defaults(),
    [startDate, setStart] = useState(initial[0]),
    [endDate, setEnd] = useState(initial[1]),
    [data, setData] = useState([]),
    [notice, setNotice] = useState("");

  useEffect(() => {
    api.get("/reports/attendance", { params: { startDate, endDate } }).then((r) => setData(r.data));
  }, [startDate, endDate]);

  async function finalize() {
    if (!confirm(`Finalize attendance from ${startDate} through ${endDate}?`)) return;
    const { data } = await api.post("/attendance/finalize", { startDate, endDate });
    setNotice(`${data.finalized} records finalized.`);
  }

  const exportUrl = `http://localhost:5000/api/reports/attendance/export?startDate=${startDate}&endDate=${endDate}`;

  return (
    <>
      <PageHeader
        title="Attendance report"
        subtitle="Custom attendance period; defaults to the 25th through the next 25th."
      >
        <button className="btn-secondary" onClick={finalize}>
          <Lock size={16} />
          Finalize range
        </button>
        <a className="btn-primary" href={exportUrl}>
          <Download size={16} />
          Export Excel
        </a>
      </PageHeader>

      {notice && (
        <div className="alert-info mb-4">
          <Info size={17} className="mt-px shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-4">
          <label>
            <span className="label">Start date</span>
            <input
              className="field"
              type="date"
              value={startDate}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label>
            <span className="label">End date</span>
            <input
              className="field"
              type="date"
              min={startDate}
              value={endDate}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
          <span className="ml-auto pb-2 text-xs font-medium text-slate-400">
            {data.length} employees
          </span>
        </div>

        {data.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th className="text-right">Working days</th>
                  <th className="text-right">Present</th>
                  <th className="text-right">Absent</th>
                  <th className="text-right">Leave</th>
                  <th className="text-right">Late</th>
                  <th className="text-right">Short</th>
                  <th className="text-right">Overtime</th>
                </tr>
              </thead>
              <tbody>
                {data.map((x) => (
                  <tr key={x.employeeId}>
                    <td className="cell-strong">{x.employeeName}</td>
                    <td className="font-mono text-xs text-slate-500">{x.employeeId}</td>
                    <td className="text-right">{x.workingDays}</td>
                    <td className="text-right font-medium text-emerald-700">{x.present}</td>
                    <td className="text-right font-medium text-red-700">{x.absent}</td>
                    <td className="text-right">{x.leave}</td>
                    <td className="text-right">{hours(x.lateMinutes)}</td>
                    <td className="text-right">{hours(x.shortMinutes)}</td>
                    <td className="text-right">{hours(x.overtimeMinutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text="No attendance data for this period." />
        )}
      </div>
    </>
  );
}
