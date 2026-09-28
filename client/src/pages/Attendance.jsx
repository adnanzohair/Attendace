import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, Pencil, Plus, SlidersHorizontal, List } from "lucide-react";
import { api, messageOf } from "../services/api";
import { Empty, fmtTime, hours, Modal, PageHeader, StatusBadge } from "../components/ui";

function defaults() {
  const now = new Date(),
    end = new Date(now.getFullYear(), now.getMonth() + 1, 25),
    start = new Date(now.getFullYear(), now.getMonth(), 25),
    key = (date) =>
      [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");
  return [key(start), key(end)];
}
const blank = {
  employee: "",
  workDate: "",
  attendanceType: "present",
  actualClockIn: "",
  actualClockOut: "",
  reason: "",
};
function inputDate(value) {
  if (!value) return "";
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

/** Minutes rendered dimmed when zero, so problem columns stand out. */
const Minutes = ({ value, tone = "text-amber-700" }) =>
  value ? <span className={`font-medium ${tone}`}>{hours(value)}</span> : <span className="text-slate-300">—</span>;

export default function Attendance() {
  const initial = defaults(),
    [startDate, setStart] = useState(initial[0]),
    [endDate, setEnd] = useState(initial[1]),
    [status, setStatus] = useState(""),
    [viewMode, setViewMode] = useState("timeline"),
    [data, setData] = useState([]),
    [employees, setEmployees] = useState([]),
    [manual, setManual] = useState(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [saving, setSaving] = useState(false);

  const load = () =>
    api
      .get("/attendance", {
        params: { startDate, endDate, status, limit: 500 },
      })
      .then((response) => setData(response.data.data))
      .catch((e) => setError(messageOf(e)));

  useEffect(() => {
    load();
  }, [startDate, endDate, status]);

  useEffect(() => {
    api
      .get("/employees", { params: { status: "active", limit: 500 } })
      .then((response) => setEmployees(response.data.data));
  }, []);

  async function saveManual(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      manual._id
        ? await api.put(`/attendance/${manual._id}`, manual)
        : await api.post("/attendance/manual", manual);
      setManual(null);
      setNotice("Attendance saved and payroll updated.");
      await load();
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setSaving(false);
    }
  }

  function editRow(record) {
    setError("");
    setManual({
      _id: record._id,
      employee: record.employee?._id || "",
      employeeName: record.employee?.name,
      workDate: record.workDate,
      attendanceType: record.leaveType || "present",
      actualClockIn: inputDate(record.actualClockIn),
      actualClockOut: inputDate(record.actualClockOut),
      reason: "",
      reopen: false,
      finalized: record.workflow === "finalized",
    });
  }

  const isLeave = manual?.attendanceType && manual.attendanceType !== "present";

  return (
    <>
      <PageHeader
        title="Attendance"
        subtitle="Use Edit on any row to correct time or assign leave."
      >
        <button
          className="btn-primary"
          onClick={() => {
            setError("");
            setManual({
              ...blank,
              workDate: new Date().toISOString().slice(0, 10),
            });
          }}
        >
          <Plus size={17} />
          Add attendance / leave
        </button>
      </PageHeader>

      {notice && (
        <div className="alert-success mb-4">
          <CheckCircle2 size={17} className="mt-px shrink-0" />
          <span>{notice}</span>
        </div>
      )}
      {!manual && error && (
        <div className="alert-error mb-4">
          <AlertCircle size={17} className="mt-px shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div className="flex flex-wrap items-end gap-3">
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
                value={endDate}
                min={startDate}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
            <label>
              <span className="label">Status</span>
              <select
                className="field w-auto"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                {[
                  "Present",
                  "Leave",
                  "Sick Leave",
                  "Casual Leave",
                  "Approved Leave",
                  "Unpaid Leave",
                  "Late",
                  "Short Hours",
                  "Overtime",
                  "Absent",
                  "Missing Clock-In",
                  "Missing Clock-Out",
                  "Attendance Error",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("timeline")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  viewMode === "timeline"
                    ? "bg-blue-50 text-[#0091ff]"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <SlidersHorizontal size={14} />
                <span>Timeline</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  viewMode === "table"
                    ? "bg-blue-50 text-[#0091ff]"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <List size={14} />
                <span>Table</span>
              </button>
            </div>
            <span className="text-xs font-medium text-slate-400">
              {data.length} records
            </span>
          </div>
        </div>

        {data.length ? (
          viewMode === "timeline" ? (
            <div className="divide-y divide-slate-100 p-4">
              {data.map((x) => {
                const parts = (x.workDate || "").split("-");
                const dayNum = parts.length === 3 ? parts[2] : x.workDate;
                const d = parts.length === 3 ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])) : null;
                const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
                const dayName = d ? dayNames[d.getDay()] : "---";

                const isAbsent = x.conditions?.includes("Absent") || x.status === "Absent";
                const isLeave = x.conditions?.some(c => c.includes("Leave")) || x.leaveType;
                const isPresent = (x.actualMinutes > 0 || x.actualClockIn) && !isAbsent;

                let lineColor = "bg-emerald-500";
                let dotColor = "bg-emerald-500";
                let badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
                let badgeText = "Office-in";

                if (isAbsent) {
                  lineColor = "bg-rose-400";
                  dotColor = "bg-rose-500";
                  badgeStyle = "bg-rose-50 text-rose-700 border-rose-200";
                  badgeText = "Absent";
                } else if (isLeave) {
                  lineColor = "bg-indigo-400";
                  dotColor = "bg-indigo-500";
                  badgeStyle = "bg-indigo-50 text-indigo-700 border-indigo-200";
                  badgeText = x.leaveType ? `${x.leaveType} leave` : "Leave";
                } else if (x.conditions?.includes("Remote")) {
                  lineColor = "bg-cyan-500";
                  dotColor = "bg-cyan-500";
                  badgeStyle = "bg-cyan-50 text-cyan-700 border-cyan-200";
                  badgeText = "Remote-in";
                } else {
                  badgeText = x.conditions?.[0] || "Office-in";
                }

                return (
                  <div
                    key={x._id}
                    className="flex flex-col gap-3 rounded-xl py-3.5 px-3 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-4"
                  >
                    {/* Date & Employee info */}
                    <div className="flex w-44 shrink-0 items-center gap-3">
                      <div className="flex w-12 flex-col leading-tight">
                        <span className="text-sm font-bold text-slate-800">{dayNum}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{dayName}</span>
                      </div>
                      <div className="min-w-0 flex-1 leading-tight">
                        <Link to={`/attendance/${x._id}`} className="block truncate font-semibold text-xs text-slate-800 hover:text-[#0091ff]">
                          {x.employee?.name}
                        </Link>
                        <span className="text-[10px] font-mono text-slate-400">{x.employeeId}</span>
                      </div>
                    </div>

                    {/* Clock In */}
                    <div className="w-20 shrink-0 text-xs font-bold text-slate-700 text-left">
                      {fmtTime(x.actualClockIn) || "00:00"}
                    </div>

                    {/* Timeline Line with Badge */}
                    <div className="relative flex flex-1 items-center px-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${dotColor} shrink-0 ring-2 ring-white shadow-xs`} />
                      <span className={`h-[2px] flex-1 ${lineColor}`} />
                      <span className={`mx-2 inline-flex items-center justify-center rounded-md border px-2.5 py-0.5 text-xs font-medium shadow-2xs whitespace-nowrap ${badgeStyle}`}>
                        {badgeText}
                      </span>
                      <span className={`h-[2px] flex-1 ${lineColor}`} />
                      <span className={`h-2.5 w-2.5 rounded-full ${dotColor} shrink-0 ring-2 ring-white shadow-xs`} />
                    </div>

                    {/* Clock Out */}
                    <div className="w-20 shrink-0 text-xs font-bold text-slate-700 text-right">
                      {fmtTime(x.actualClockOut) || "00:00"}
                    </div>

                    {/* Worked Hours */}
                    <div className="flex w-24 shrink-0 flex-col items-end leading-tight text-right">
                      <span className="text-xs font-bold text-slate-800">{hours(x.actualMinutes)}</span>
                      <span className="text-[10px] text-slate-400">Hrs Worked</span>
                    </div>

                    {/* Action */}
                    <div className="w-16 shrink-0 text-right">
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => editRow(x)}
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Employee</th>
                    <th>ID</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Worked</th>
                    <th>Late</th>
                    <th>Short</th>
                    <th>Conditions</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((x) => (
                    <tr key={x._id}>
                      <td>
                        <Link className="link" to={`/attendance/${x._id}`}>
                          {x.workDate}
                        </Link>
                      </td>
                      <td className="cell-strong">{x.employee?.name}</td>
                      <td className="font-mono text-xs text-slate-500">{x.employeeId}</td>
                      <td>{fmtTime(x.actualClockIn)}</td>
                      <td>{fmtTime(x.actualClockOut)}</td>
                      <td className="font-medium text-ink">{hours(x.actualMinutes)}</td>
                      <td>
                        <Minutes value={x.lateMinutes} />
                      </td>
                      <td>
                        <Minutes value={x.shortMinutes} tone="text-orange-700" />
                      </td>
                      <td>
                        <StatusBadge value={x.conditions} />
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          onClick={() => editRow(x)}
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <Empty text="No attendance records in this range." />
        )}
      </div>

      {manual && (
        <Modal
          title={manual._id ? "Edit attendance" : "Add attendance or leave"}
          onClose={() => setManual(null)}
        >
          <form onSubmit={saveManual}>
            {error && (
              <div className="alert-error mb-4">
                <AlertCircle size={17} className="mt-px shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {manual._id ? (
              <div className="panel grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="eyebrow">Employee</div>
                  <div className="mt-0.5 font-semibold text-ink">{manual.employeeName}</div>
                </div>
                <div>
                  <div className="eyebrow">Date</div>
                  <div className="mt-0.5 font-semibold text-ink">{manual.workDate}</div>
                </div>
              </div>
            ) : (
              <>
                <label className="block">
                  <span className="label">Employee</span>
                  <select
                    className="field"
                    value={manual.employee}
                    onChange={(e) =>
                      setManual({ ...manual, employee: e.target.value })
                    }
                    required
                  >
                    <option value="">Select employee</option>
                    {employees.map((x) => (
                      <option key={x._id} value={x._id}>
                        {x.name} · {x.employeeId}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mt-4 block">
                  <span className="label">Date</span>
                  <input
                    className="field"
                    type="date"
                    value={manual.workDate}
                    onChange={(e) =>
                      setManual({ ...manual, workDate: e.target.value })
                    }
                    required
                  />
                </label>
              </>
            )}
            <label className="mt-4 block">
              <span className="label">Attendance type</span>
              <select
                className="field"
                value={manual.attendanceType}
                onChange={(e) =>
                  setManual({ ...manual, attendanceType: e.target.value })
                }
              >
                <option value="present">Present / manual time</option>
                <option value="sick">Sick Leave</option>
                <option value="casual">Casual Leave</option>
                <option value="work-from-home">Work From Home</option>
              </select>
            </label>
            {!isLeave && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="label">Clock in</span>
                  <input
                    className="field"
                    type="datetime-local"
                    value={manual.actualClockIn}
                    onChange={(e) =>
                      setManual({ ...manual, actualClockIn: e.target.value })
                    }
                  />
                </label>
                <label>
                  <span className="label">Clock out</span>
                  <input
                    className="field"
                    type="datetime-local"
                    value={manual.actualClockOut}
                    onChange={(e) =>
                      setManual({ ...manual, actualClockOut: e.target.value })
                    }
                  />
                </label>
              </div>
            )}
            <label className="mt-4 block">
              <span className="label">Reason ({isLeave ? "required" : "optional"})</span>
              <textarea
                className="field"
                rows="3"
                value={manual.reason}
                onChange={(e) =>
                  setManual({ ...manual, reason: e.target.value })
                }
                placeholder={
                  isLeave
                    ? "Leave approval or reason"
                    : "Optional note about this correction"
                }
                required={isLeave}
              />
            </label>
            {manual.finalized && (
              <label className="mt-4 flex cursor-pointer items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={manual.reopen}
                  onChange={(e) =>
                    setManual({ ...manual, reopen: e.target.checked })
                  }
                />
                <span className="text-sm font-medium text-amber-800">
                  Explicitly reopen finalized record
                </span>
              </label>
            )}
            <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setManual(null)}
              >
                Cancel
              </button>
              <button disabled={saving} className="btn-primary">
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
