import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { api, messageOf } from "../services/api";
import { fmtTime, hours, Spinner, StatusBadge } from "../components/ui";

function inputDate(value) {
  if (!value) return "";
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function AttendanceDetail() {
  const { id } = useParams(),
    navigate = useNavigate();
  const [data, setData] = useState(),
    [form, setForm] = useState({}),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [saving, setSaving] = useState(false);

  const load = () =>
    api.get(`/attendance/${id}`).then((response) => {
      const record = response.data;
      setData(record);
      setForm({
        attendanceType: record.leaveType || "present",
        actualClockIn: inputDate(record.actualClockIn),
        actualClockOut: inputDate(record.actualClockOut),
        reason: "",
        reopen: false,
      });
    });

  useEffect(() => {
    load();
  }, [id]);

  if (!data) return <Spinner />;

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.put(`/attendance/${id}`, form);
      await load();
      setNotice("Attendance updated. Payroll calculations now use this change.");
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setSaving(false);
    }
  }

  const isLeave = form.attendanceType !== "present";
  const metrics = [
    ["Expected in", fmtTime(data.expectedClockIn)],
    ["Expected out", fmtTime(data.expectedClockOut)],
    ["Actual in", fmtTime(data.actualClockIn)],
    ["Actual out", fmtTime(data.actualClockOut)],
    ["Working time", hours(data.actualMinutes)],
    ["Late", hours(data.lateMinutes)],
    ["Short", hours(data.shortMinutes)],
    ["Overtime", hours(data.overtimeMinutes)],
  ];

  return (
    <>
      <button className="btn-ghost btn-sm -ml-2 mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft size={15} />
        Back
      </button>

      <div className="mb-6">
        <h1 className="page-title">
          {data.employee?.name} <span className="text-slate-300">·</span> {data.workDate}
        </h1>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {data.conditions.map((x) => (
            <StatusBadge key={x} value={x} />
          ))}
        </div>
      </div>

      {notice && (
        <div className="alert-success mb-4">
          <CheckCircle2 size={17} className="mt-px shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Calculated attendance</h2>
          </div>
          <div className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-4">
            {metrics.map(([key, value]) => (
              <div key={key} className="bg-white p-4">
                <div className="eyebrow">{key}</div>
                <div className="mt-1.5 text-sm font-semibold text-ink">{value}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 px-5 py-4 text-xs leading-relaxed text-slate-500">
            {data.sourcePunchIds.length} original punches linked. Original machine punches are
            never changed.
          </div>
        </div>

        <form onSubmit={save} className="card">
          <div className="card-header">
            <h2 className="card-title">Manual adjustment or leave</h2>
          </div>
          <div className="p-5">
            {error && (
              <div className="alert-error mb-4">
                <AlertCircle size={17} className="mt-px shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <label className="block">
              <span className="label">Attendance type</span>
              <select
                className="field"
                value={form.attendanceType}
                onChange={(e) => setForm({ ...form, attendanceType: e.target.value })}
              >
                <option value="present">Present / time correction</option>
                <option value="sick">Sick Leave</option>
                <option value="casual">Casual Leave</option>
              </select>
            </label>
            {!isLeave && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="label">Actual clock in</span>
                  <input
                    className="field"
                    type="datetime-local"
                    value={form.actualClockIn}
                    onChange={(e) => setForm({ ...form, actualClockIn: e.target.value })}
                  />
                </label>
                <label>
                  <span className="label">Actual clock out</span>
                  <input
                    className="field"
                    type="datetime-local"
                    value={form.actualClockOut}
                    onChange={(e) => setForm({ ...form, actualClockOut: e.target.value })}
                  />
                </label>
              </div>
            )}
            <label className="mt-4 block">
              <span className="label">Reason ({isLeave ? "required" : "optional"})</span>
              <textarea
                className="field"
                rows="3"
                placeholder={
                  isLeave
                    ? "Example: Sick leave approved by HR"
                    : "Optional note about this correction"
                }
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                required={isLeave}
              />
            </label>
            {data.workflow === "finalized" && (
              <label className="mt-4 flex cursor-pointer items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={form.reopen}
                  onChange={(e) => setForm({ ...form, reopen: e.target.checked })}
                />
                <span className="text-sm font-medium text-amber-800">
                  Explicitly reopen finalized record
                </span>
              </label>
            )}
            <button disabled={saving} className="btn-primary mt-5 w-full">
              {saving ? "Saving…" : isLeave ? "Save leave" : "Save and recalculate"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
