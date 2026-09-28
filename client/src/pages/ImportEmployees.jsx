import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, CheckCircle2, FileSpreadsheet, UploadCloud } from "lucide-react";
import { api, messageOf } from "../services/api";
import { PageHeader } from "../components/ui";

const fields = {
  employeeId: "Employee ID",
  name: "Employee name",
  fatherName: "Father name",
  designation: "Designation",
  phone: "Phone",
  email: "Email",
  joiningDate: "Joining date",
};

export default function ImportEmployees() {
  const [file, setFile] = useState(),
    [info, setInfo] = useState(),
    [mapping, setMapping] = useState({}),
    [result, setResult] = useState(),
    [error, setError] = useState("");

  async function inspect(f) {
    setFile(f);
    const fd = new FormData();
    fd.append("file", f);
    try {
      const { data } = await api.post("/employees/inspect", fd);
      setInfo(data);
      setMapping(data.suggestedMapping);
    } catch (e) {
      setError(messageOf(e));
    }
  }

  async function run() {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("mapping", JSON.stringify(mapping));
    fd.append("sheetName", info.sheetName);
    fd.append("headerRow", info.headerRow);
    try {
      setResult((await api.post("/employees/import", fd)).data);
    } catch (e) {
      setError(messageOf(e));
    }
  }

  return (
    <>
      <Link to="/employees" className="btn-ghost btn-sm -ml-2 mb-4">
        <ArrowLeft size={15} />
        Employees
      </Link>

      <PageHeader
        title="Import employees"
        subtitle="Upload an employee sheet and map its columns to Attendly fields."
      />

      <div className="mx-auto max-w-3xl">
        <div className="card p-6">
          {error && (
            <div className="alert-error mb-5">
              <AlertCircle size={17} className="mt-px shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <CheckCircle2 size={26} />
              </div>
              <h2 className="mt-5 text-xl font-semibold tracking-tight text-ink">
                Import complete
              </h2>
              <div className="mx-auto mt-7 grid max-w-md grid-cols-3 gap-3 text-left">
                {[
                  ["Created", result.created],
                  ["Updated", result.updated],
                  ["Skipped", result.skipped],
                ].map(([k, v]) => (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4" key={k}>
                    <div className="stat-value">{v}</div>
                    <div className="stat-label">{k}</div>
                  </div>
                ))}
              </div>
              <Link className="btn-primary mt-8" to="/employees">
                View employees
              </Link>
            </div>
          ) : (
            <>
              <label className="group grid cursor-pointer place-items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-10 text-center transition hover:border-brand-400 hover:bg-brand-50/40">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-brand-600 shadow-card ring-1 ring-slate-200 transition group-hover:ring-brand-200">
                  <UploadCloud size={24} />
                </div>
                <div className="mt-4 text-sm font-semibold text-ink">Choose employee sheet</div>
                <div className="mt-1 text-xs text-slate-500">.xls or .xlsx</div>
                <input
                  className="hidden"
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={(e) => e.target.files[0] && inspect(e.target.files[0])}
                />
              </label>

              {file && (
                <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5">
                  <FileSpreadsheet size={17} className="shrink-0 text-emerald-600" />
                  <span className="truncate text-sm font-medium text-ink">{file.name}</span>
                </div>
              )}

              {info && (
                <div className="mt-7 border-t border-slate-200 pt-6">
                  <h2 className="text-sm font-semibold tracking-tight text-ink">
                    Confirm column mapping
                  </h2>
                  <p className="muted mb-5 mt-1 text-xs">
                    Using {info.sheetName}, header row {info.headerRow}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {Object.entries(fields).map(([k, l]) => (
                      <label key={k}>
                        <span className="label">{l}</span>
                        <select
                          className="field"
                          value={mapping[k] || ""}
                          onChange={(e) => setMapping({ ...mapping, [k]: e.target.value })}
                        >
                          <option value="">Not mapped</option>
                          {info.headers.filter(Boolean).map((h) => (
                            <option key={h}>{h}</option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                  <button className="btn-primary mt-6 w-full" onClick={run}>
                    Import employees
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
