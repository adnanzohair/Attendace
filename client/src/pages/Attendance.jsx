import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus } from "lucide-react";
import { api, messageOf } from "../services/api";
import { Empty, fmtTime, hours, Modal, StatusBadge } from "../components/ui";

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
export default function Attendance() {
  const initial = defaults(),
    [startDate, setStart] = useState(initial[0]),
    [endDate, setEnd] = useState(initial[1]),
    [status, setStatus] = useState(""),
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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="muted mt-1">
            Use Edit on any row to correct time or assign leave.
          </p>
        </div>
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
          <Plus size={18} />
          Add attendance / leave
        </button>
      </div>
      {notice && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-green-700">
          {notice}
        </div>
      )}
      {!manual && error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}
      <div className="card">
        <div className="flex flex-wrap items-end gap-3 border-b p-4">
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
        </div>
        {data.length ? (
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
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.map((x) => (
                  <tr key={x._id}>
                    <td>
                      <Link
                        className="text-brand-600"
                        to={`/attendance/${x._id}`}
                      >
                        {x.workDate}
                      </Link>
                    </td>
                    <td>{x.employee?.name}</td>
                    <td>{x.employeeId}</td>
                    <td>{fmtTime(x.actualClockIn)}</td>
                    <td>{fmtTime(x.actualClockOut)}</td>
                    <td>{hours(x.actualMinutes)}</td>
                    <td>{hours(x.lateMinutes)}</td>
                    <td>{hours(x.shortMinutes)}</td>
                    <td>
                      <StatusBadge value={x.conditions} />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-secondary px-3 py-1.5"
                        onClick={() => editRow(x)}
                      >
                        <Pencil size={15} />
                        Edit
                      </button>
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
      {manual && (
        <Modal
          title={manual._id ? "Edit attendance" : "Add attendance or leave"}
          onClose={() => setManual(null)}
        >
          <form onSubmit={saveManual}>
            {error && (
              <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {manual._id ? (
              <div className="grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
                <div>
                  <span className="text-xs text-slate-500">Employee</span>
                  <div className="font-semibold">{manual.employeeName}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Date</span>
                  <div className="font-semibold">{manual.workDate}</div>
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
              <span className="label">Reason (required)</span>
              <textarea
                className="field"
                value={manual.reason}
                onChange={(e) =>
                  setManual({ ...manual, reason: e.target.value })
                }
                placeholder={
                  isLeave
                    ? "Leave approval or reason"
                    : "Why is this time being changed?"
                }
                required
              />
            </label>
            {manual.finalized && (
              <label className="mt-4 flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={manual.reopen}
                  onChange={(e) =>
                    setManual({ ...manual, reopen: e.target.checked })
                  }
                />
                Explicitly reopen finalized record
              </label>
            )}
            <div className="mt-5 flex justify-end gap-2">
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
