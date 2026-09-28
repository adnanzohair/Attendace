import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { api, messageOf } from "../services/api";
import { PageHeader, Spinner } from "../components/ui";

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
      <PageHeader
        title="Settings"
        subtitle="Company and future payroll rules. Attendance continues to track all values."
      />

      <form onSubmit={save} className="max-w-3xl space-y-6">
        {notice && (
          <div className="alert-info">
            <Info size={17} className="mt-px shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Company</h2>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
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
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Attendance grace</h2>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
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
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Payroll rules</h2>
          </div>
          <div className="p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="panel">
                <div className="label mb-1">Salary working-day divisor</div>
                <p className="text-xs leading-relaxed text-slate-500">
                  Calculated automatically from each payslip date range, excluding weekends,
                  company holidays and dates before joining.
                </p>
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

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ["deductLateHours", "Deduct late hours"],
                ["deductShortHours", "Deduct short hours"],
                ["payOvertime", "Pay overtime"],
              ].map(([k, l]) => (
                <label
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5 transition hover:border-slate-300"
                  key={k}
                >
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={!!payroll[k]}
                    onChange={(e) =>
                      setD({ ...d, payroll: { ...payroll, [k]: e.target.checked } })
                    }
                  />
                  <span className="text-sm font-medium text-slate-700">{l}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="btn-primary">Save settings</button>
        </div>
      </form>
    </>
  );
}
