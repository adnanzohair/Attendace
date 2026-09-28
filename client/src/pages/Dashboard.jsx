import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  ClockAlert,
  TimerOff,
  ScanLine,
  TriangleAlert,
} from "lucide-react";
import { api } from "../services/api";
import { Empty, fmtTime, PageHeader, Spinner, StatusBadge } from "../components/ui";

const items = [
  ["totalEmployees", "Total Employees", Users, "bg-brand-50 text-brand-600 ring-brand-100"],
  ["present", "Present Today", UserCheck, "bg-emerald-50 text-emerald-600 ring-emerald-100"],
  ["absent", "Absent Today", UserX, "bg-red-50 text-red-600 ring-red-100"],
  ["late", "Late Today", ClockAlert, "bg-amber-50 text-amber-600 ring-amber-100"],
  ["shortHours", "Short Hours", TimerOff, "bg-orange-50 text-orange-600 ring-orange-100"],
  ["missingPunches", "Missing Punches", ScanLine, "bg-sky-50 text-sky-600 ring-sky-100"],
  ["attendanceErrors", "Errors", TriangleAlert, "bg-rose-50 text-rose-600 ring-rose-100"],
];

export default function Dashboard() {
  const [d, setD] = useState();

  useEffect(() => {
    api.get("/dashboard").then((r) => setD(r.data));
  }, []);

  if (!d) return <Spinner />;

  return (
    <>
      <PageHeader
        title="Attendance overview"
        subtitle="A clear view of today’s workforce activity."
      />

      <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map(([key, label, Icon, tone]) => (
          <div className="stat-card" key={key}>
            <div className={`stat-icon ${tone}`}>
              <Icon size={19} />
            </div>
            <div className="min-w-0">
              <div className="stat-value">{d.stats[key]}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="card-header">
          <h2 className="card-title">Recent attendance</h2>
          <span className="eyebrow">{d.recent.length} records</span>
        </div>
        {d.recent.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {d.recent.map((x) => (
                  <tr key={x._id}>
                    <td className="cell-strong">{x.employee?.name}</td>
                    <td className="font-mono text-xs text-slate-500">{x.employeeId}</td>
                    <td>{fmtTime(x.actualClockIn)}</td>
                    <td>{fmtTime(x.actualClockOut)}</td>
                    <td>
                      <StatusBadge value={x.conditions} />
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
