import { useEffect, useState } from "react";
import { api, messageOf } from "../services/api";
import { Spinner } from "../components/ui";
export default function Settings() {
  const [d, setD] = useState(),
    [notice, setNotice] = useState("");
  useEffect(() => {
    api.get("/settings").then((r) => setD(r.data));
  }, []);
  if (!d) return <Spinner />;
  async function save(e) {
    e.preventDefault();
    try {
      const { data } = await api.put("/settings", d);
      setD(data);
      setNotice("Settings saved");
    } catch (e) {
      setNotice(messageOf(e));
    }
  }
  const payroll = d.payroll || {};
  const attendanceGrace = d.attendanceGrace || {
    mondayThursdayMinutes: 0,
    fridayMinutes: 0,
  };
  return (
    <>
      <div className="mb-6">
        <h1 className="page-title">Settings</h1>
        <p className="muted mt-1">
          Company and future payroll rules. Attendance continues to track all
          values.
        </p>
      </div>
      <form onSubmit={save} className="card max-w-3xl p-6">
        {notice && (
          <div className="mb-4 rounded-lg bg-brand-50 p-3 text-sm text-brand-700">
            {notice}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="label">Company name</span>
            <input
              className="field"
              value={d.companyName}
              onChange={(e) => setD({ ...d, companyName: e.target.value })}
            />
          </label>
          <label>
            <span className="label">Timezone</span>
            <input
              className="field"
              value={d.timezone}
              onChange={(e) => setD({ ...d, timezone: e.target.value })}
            />
          </label>
          <label>
            <span className="label">Monday–Thursday grace (minutes)</span>
            <input
              className="field"
              type="number"
              min="0"
              max="240"
              value={attendanceGrace.mondayThursdayMinutes}
              onChange={(e) =>
                setD({
                  ...d,
                  attendanceGrace: {
                    ...attendanceGrace,
                    mondayThursdayMinutes: +e.target.value,
                  },
                })
              }
            />
          </label>
          <label>
            <span className="label">Friday grace (minutes)</span>
            <input
              className="field"
              type="number"
              min="0"
              max="240"
              value={attendanceGrace.fridayMinutes}
              onChange={(e) =>
                setD({
                  ...d,
                  attendanceGrace: {
                    ...attendanceGrace,
                    fridayMinutes: +e.target.value,
                  },
                })
              }
            />
          </label>
          <div className="rounded-lg border bg-slate-50 p-3 text-sm text-slate-600">
            <span className="label">Salary working-day divisor</span>
            Calculated automatically from each payslip date range, excluding
            weekends, company holidays and dates before joining.
          </div>
          <label>
            <span className="label">Rounding (minutes)</span>
            <input
              className="field"
              type="number"
              value={payroll.roundingMinutes}
              onChange={(e) =>
                setD({
                  ...d,
                  payroll: { ...payroll, roundingMinutes: +e.target.value },
                })
              }
            />
          </label>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            ["deductLateHours", "Deduct late hours"],
            ["deductShortHours", "Deduct short hours"],
            ["payOvertime", "Pay overtime"],
          ].map(([k, l]) => (
            <label
              className="flex items-center gap-3 rounded-lg border p-3"
              key={k}
            >
              <input
                type="checkbox"
                checked={!!payroll[k]}
                onChange={(e) =>
                  setD({ ...d, payroll: { ...payroll, [k]: e.target.checked } })
                }
              />
              <span className="text-sm font-medium">{l}</span>
            </label>
          ))}
        </div>
        <button className="btn-primary mt-6">Save settings</button>
      </form>
    </>
  );
}
