import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, FileSpreadsheet, UploadCloud } from "lucide-react";
import { api, messageOf } from "../services/api";
import { PageHeader } from "../components/ui";

const fields = [
  ["employeeId", "Employee ID"],
  ["employeeName", "Employee name"],
  ["date", "Punch date"],
  ["time", "Punch time"],
  ["type", "Machine type"],
];

export default function ImportAttendance() {
  const [file, setFile] = useState(),
    [inspection, setInspection] = useState(),
    [mapping, setMapping] = useState({}),
    [stage, setStage] = useState(""),
    [result, setResult] = useState(),
    [error, setError] = useState(""),
    nav = useNavigate();

  async function inspect(f) {
    setFile(f);
    setError("");
    const fd = new FormData();
    fd.append("file", f);
    try {
      const { data } = await api.post("/attendance/inspect", fd);
      setInspection(data);
      setMapping(data.suggestedMapping);
    } catch (e) {
      setError(messageOf(e));
    }
  }

  async function process() {
    setStage("Reading Excel…");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("mapping", JSON.stringify(mapping));
    try {
      setTimeout(() => setStage("Matching employees and calculating attendance…"), 300);
      const { data } = await api.post("/attendance/import", fd);
      setResult(data);
      setStage("");
    } catch (e) {
      setError(messageOf(e));
      setStage("");
    }
  }

  return (
    <>
      <PageHeader
        title="Import attendance"
        subtitle="Upload the original biometric Excel export. The source data is never modified."
      />

      <div className="mx-auto max-w-3xl">
        {!result ? (
          <div className="card p-6">
            {error && (
              <div className="alert-error mb-5">
                <AlertCircle size={17} className="mt-px shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <label className="group grid cursor-pointer place-items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-10 text-center transition hover:border-brand-400 hover:bg-brand-50/40">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-brand-600 shadow-card ring-1 ring-slate-200 transition group-hover:ring-brand-200">
                <UploadCloud size={24} />
              </div>
              <div className="mt-4 text-sm font-semibold text-ink">Choose Excel file</div>
              <div className="mt-1 text-xs text-slate-500">.xls or .xlsx, up to 15 MB</div>
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

            {inspection && (
              <div className="mt-7 border-t border-slate-200 pt-6">
                <h2 className="text-sm font-semibold tracking-tight text-ink">
                  Confirm column mapping
                </h2>
                <p className="muted mb-5 mt-1 text-xs">
                  {inspection.preview.length} preview rows · Sheet: {inspection.sheetNames[0]}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {fields.map(([k, l]) => (
                    <label key={k}>
                      <span className="label">{l}</span>
                      <select
                        className="field"
                        value={mapping[k] || ""}
                        onChange={(e) => setMapping({ ...mapping, [k]: e.target.value })}
                      >
                        <option value="">Not mapped</option>
                        {inspection.headers.map((h) => (
                          <option key={h}>{h}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <button className="btn-primary mt-6 w-full" disabled={!!stage} onClick={process}>
                  {stage || "Process attendance"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <CheckCircle2 size={26} />
            </div>
            <h2 className="mt-5 text-xl font-semibold tracking-tight text-ink">Import complete</h2>
            <p className="muted mt-1.5">Attendance has been calculated from the uploaded file.</p>

            <div className="mx-auto mt-7 grid max-w-xl grid-cols-2 gap-3 text-left sm:grid-cols-4">
              {[
                ["Raw records", result.rawRecords],
                ["Matched employees", result.matchedEmployees],
                ["Attendance created", result.attendanceCreated],
                ["Exceptions", result.exceptions],
              ].map(([k, v]) => (
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4" key={k}>
                  <div className="stat-value">{v}</div>
                  <div className="stat-label">{k}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button className="btn-secondary" onClick={() => nav("/attendance/exceptions")}>
                View exceptions
              </button>
              <button className="btn-primary" onClick={() => nav("/attendance")}>
                View attendance
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
