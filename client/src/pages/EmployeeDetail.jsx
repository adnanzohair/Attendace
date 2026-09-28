import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { api, messageOf } from "../services/api";
import { Empty, fmtTime, hours, Spinner, StatusBadge } from "../components/ui";

const today = new Date().toISOString().slice(0, 10),
  prior = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  })();

export default function EmployeeDetail() {
  const { id } = useParams(),
    [startDate, setStart] = useState(prior),
    [endDate, setEnd] = useState(today),
    [d, setD] = useState(),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setD((await api.get(`/employee-reports/${id}`, { params: { startDate, endDate } })).data);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  if (loading && !d) return <Spinner />;

  const s = d?.summary || {};
  const stats = [
    ["Working days", s.totalWorkingDays],
    ["Present", s.daysPresent],
    ["Absent", s.daysAbsent],
    ["Leave", s.daysLeave],
    ["Hours worked", hours(s.totalActualMinutes)],
    ["Short hours", hours(s.totalShortMinutes)],
    ["Overtime", hours(s.totalOvertimeMinutes)],
    ["Late hours", hours(s.totalLateMinutes)],
    ["Average / worked day", hours(s.averageWorkingMinutes)],
    ["Early departure", hours(s.totalEarlyLeaveMinutes)],
  ];

  return (
    <>
      <Link to="/employees" className="btn-ghost btn-sm -ml-2 mb-4">
        <ArrowLeft size={15} />
        Employees
      </Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">{d?.employee.name}</h1>
          <p className="page-subtitle">
            Enroll ID {d?.employee.employeeId}
            <span className="text-slate-300"> · </span>
            {d?.employee.designation || "No designation"}
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <label>
            <span className="label">Start date</span>
            <input
              className="field"
              type="date"
              value={startDate}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </label>
          <label>
            <span className="label">End date</span>
            <input
              className="field"
              type="date"
              value={endDate}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </label>
          <button className="btn-primary">Generate report</button>
        </form>
      </div>

      {error && (
        <div className="alert-error mb-4">
          <AlertCircle size={17} className="mt-px shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map(([k, v]) => (
          <div className="card p-4" key={k}>
            <div className="text-xl font-semibold leading-none tracking-tightest text-ink">
              {v ?? 0}
            </div>
            <div className="stat-label">{k}</div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="card-header">
          <h2 className="card-title">Daily attendance</h2>
          <span className="eyebrow">
            {startDate} → {endDate}
          </span>
        </div>
        {d?.daily.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check in</th>
                  <th>Check out</th>
                  <th>Worked</th>
                  <th>Expected</th>
                  <th>Short</th>
                  <th>Overtime</th>
                  <th>Late</th>
                  <th>Early departure</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {d.daily.map((x) => (
                  <tr key={x.workDate}>
                    <td className="cell-strong">{x.workDate}</td>
                    <td>{fmtTime(x.actualClockIn)}</td>
                    <td>{fmtTime(x.actualClockOut)}</td>
                    <td className="font-medium text-ink">{hours(x.actualMinutes)}</td>
                    <td>{hours(x.expectedMinutes)}</td>
                    <td>{hours(x.shortMinutes)}</td>
                    <td>{hours(x.overtimeMinutes)}</td>
                    <td>{hours(x.lateMinutes)}</td>
                    <td>{hours(x.earlyLeaveMinutes)}</td>
                    <td>
                      <StatusBadge value={x.statusLabel} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty />
        )}
      </div>
    </>
  );
}
