import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, MailPlus, Pencil, Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { api, messageOf } from "../services/api";
import { Empty, Modal, PageHeader, StatusBadge } from "../components/ui";
import { grantedLeaveValue } from "../utils/leaveBalancePresentation";

const blank = {
  employeeId: "",
  name: "",
  fatherName: "",
  designation: "",
  department: "",
  joiningDate: "",
  phone: "",
  email: "",
  status: "active",
  monthlySalary: 0,
  salaryCurrency: "PKR",
  payrollSettings: {
    lateDeductionOverride: "inherit",
    overtimeEligible: false,
  },
  leavePolicy: { sickGranted: 0, casualGranted: 0 },
};
const editableFields = [
  "employeeId",
  "name",
  "fatherName",
  "designation",
  "department",
  "joiningDate",
  "phone",
  "email",
  "status",
  "monthlySalary",
  "salaryCurrency",
  "payrollSettings",
  "leavePolicy",
];
const formEmployee = (employee) => ({
  ...structuredClone(blank),
  ...employee,
  joiningDate: employee.joiningDate?.slice(0, 10) || "",
  payrollSettings: { ...blank.payrollSettings, ...employee.payrollSettings },
  leavePolicy: { ...blank.leavePolicy, ...employee.leavePolicy },
});

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "—";

const SectionTitle = ({ children }) => (
  <div className="eyebrow border-b border-slate-200 pb-2 sm:col-span-2">{children}</div>
);

export default function Employees() {
  const [data, setData] = useState([]),
    [search, setSearch] = useState(""),
    [edit, setEdit] = useState(null);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [saving, setSaving] = useState(false);
  const load = () =>
    api
      .get("/employees", { params: { search, limit: 500 } })
      .then((r) => setData(r.data.data))
      .catch((e) => setError(messageOf(e)));
  useEffect(() => {
    load();
  }, []);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = Object.fromEntries(
        editableFields.map((field) => [field, edit[field]]),
      );
      payload.monthlySalary = Number(payload.monthlySalary || 0);
      edit._id
        ? await api.put(`/employees/${edit._id}`, payload)
        : await api.post("/employees", payload);
      setEdit(null);
      setNotice("Employee saved successfully.");
      await load();
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setSaving(false);
    }
  }

  async function invite(employee) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const { data: result } = await api.post(
        `/employees/${employee._id}/invite`,
      );
      setNotice(result.message);
    } catch (requestError) {
      setError(messageOf(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle="Manage employee details, salary and active status."
      >
        <button
          className="btn-primary"
          onClick={() => {
            setError("");
            setEdit(structuredClone(blank));
          }}
        >
          <Plus size={17} />
          Add employee
        </button>
      </PageHeader>

      {notice && (
        <div className="alert-success mb-4">
          <CheckCircle2 size={17} className="mt-px shrink-0" />
          <span>{notice}</span>
        </div>
      )}
      {!edit && error && (
        <div className="alert-error mb-4">
          <AlertCircle size={17} className="mt-px shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="card overflow-hidden">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="flex flex-wrap items-center gap-2.5 border-b border-slate-200 p-4"
        >
          <div className="relative min-w-[16rem] max-w-md flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={17}
            />
            <input
              className="field pl-9"
              placeholder="Search name, ID, department…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-secondary">Search</button>
          <span className="ml-auto hidden text-xs font-medium text-slate-400 sm:block">
            {data.length} employees
          </span>
        </form>

        {data.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Enroll ID</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th className="text-right">Monthly salary</th>
                  <th>Sick leave</th>
                  <th>Casual leave</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((x) => (
                  <tr key={x._id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-2xs font-bold text-slate-500">
                          {initials(x.name)}
                        </div>
                        <div className="min-w-0 leading-tight">
                          <div className="truncate font-medium text-ink">{x.name}</div>
                          {x.email && (
                            <div className="truncate text-xs text-slate-400">{x.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-xs text-slate-500">{x.employeeId}</td>
                    <td>{x.department || "—"}</td>
                    <td>{x.designation || "—"}</td>
                    <td className="text-right">
                      <span className="text-xs text-slate-400">{x.salaryCurrency || "PKR"}</span>{" "}
                      <span className="font-medium text-ink">
                        {Number(x.monthlySalary || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="text-xs">
                      <span className="font-medium text-ink">{x.leaveUsage?.sickUsed || 0}</span>
                      <span className="text-slate-400">
                        {" "}
                        / {grantedLeaveValue(x.leavePolicy?.sickGranted)}
                      </span>
                    </td>
                    <td className="text-xs">
                      <span className="font-medium text-ink">{x.leaveUsage?.casualUsed || 0}</span>
                      <span className="text-slate-400">
                        {" "}
                        / {grantedLeaveValue(x.leavePolicy?.casualGranted)}
                      </span>
                    </td>
                    <td>
                      <StatusBadge value={x.status} />
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link
                          aria-label={`View ${x.name}`}
                          title="View employee"
                          className="btn-icon"
                          to={`/employees/${x._id}`}
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          aria-label={`Edit ${x.name}`}
                          title="Edit employee"
                          type="button"
                          className="btn-icon"
                          onClick={() => {
                            setError("");
                            setEdit(formEmployee(x));
                          }}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          aria-label={`Invite ${x.name} to employee portal`}
                          title={
                            x.email
                              ? "Send employee portal invitation"
                              : "Add an email before inviting"
                          }
                          type="button"
                          disabled={saving || x.status !== "active" || !x.email}
                          className="btn-icon hover:bg-brand-50 hover:text-brand-700"
                          onClick={() => invite(x)}
                        >
                          <MailPlus size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text="No employees match this search." />
        )}
      </div>

      {edit && (
        <Modal
          title={edit._id ? "Edit employee" : "Add employee"}
          onClose={() => setEdit(null)}
        >
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            {error && (
              <div className="alert-error sm:col-span-2">
                <AlertCircle size={17} className="mt-px shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <SectionTitle>Identity</SectionTitle>
            {[
              ["employeeId", "Enroll ID"],
              ["name", "Full name"],
              ["fatherName", "Father name"],
              ["designation", "Designation"],
              ["department", "Department"],
              ["phone", "Phone"],
              ["email", "Email"],
            ].map(([k, l]) => (
              <label key={k}>
                <span className="label">{l}</span>
                <input
                  className="field"
                  value={edit[k] ?? ""}
                  onChange={(e) => setEdit({ ...edit, [k]: e.target.value })}
                  required={["employeeId", "name"].includes(k)}
                />
              </label>
            ))}
            <label>
              <span className="label">Joining date</span>
              <input
                className="field"
                type="date"
                value={edit.joiningDate || ""}
                onChange={(e) =>
                  setEdit({ ...edit, joiningDate: e.target.value })
                }
              />
            </label>
            <label>
              <span className="label">Status</span>
              <select
                className="field"
                value={edit.status}
                onChange={(e) => setEdit({ ...edit, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>

            <SectionTitle>Compensation</SectionTitle>
            <label>
              <span className="label">Monthly salary</span>
              <input
                className="field"
                type="number"
                min="0"
                step="0.01"
                value={edit.monthlySalary ?? 0}
                onChange={(e) =>
                  setEdit({ ...edit, monthlySalary: e.target.value })
                }
              />
            </label>
            <label>
              <span className="label">Salary currency</span>
              <select
                className="field"
                value={edit.salaryCurrency || "PKR"}
                onChange={(e) =>
                  setEdit({ ...edit, salaryCurrency: e.target.value })
                }
              >
                <option value="PKR">PKR — Pakistan Rupee</option>
                <option value="USD">USD — US Dollar</option>
              </select>
            </label>
            <label>
              <span className="label">Late deduction</span>
              <select
                className="field"
                value={edit.payrollSettings?.lateDeductionOverride || "inherit"}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    payrollSettings: {
                      ...edit.payrollSettings,
                      lateDeductionOverride: e.target.value,
                    },
                  })
                }
              >
                <option value="inherit">Use global setting</option>
                <option value="enabled">Enabled for employee</option>
                <option value="disabled">Disabled for employee</option>
              </select>
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 self-end rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5">
              <input
                type="checkbox"
                className="checkbox"
                checked={Boolean(edit.payrollSettings?.overtimeEligible)}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    payrollSettings: {
                      ...edit.payrollSettings,
                      overtimeEligible: e.target.checked,
                    },
                  })
                }
              />
              <span className="text-sm font-medium text-slate-700">
                Eligible for paid overtime
              </span>
            </label>

            <SectionTitle>Leave policy</SectionTitle>
            <label>
              <span className="label">Sick leaves granted yearly</span>
              <input
                className="field"
                type="number"
                min="0"
                step="1"
                value={edit.leavePolicy?.sickGranted ?? 0}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    leavePolicy: {
                      ...edit.leavePolicy,
                      sickGranted: e.target.value,
                    },
                  })
                }
              />
            </label>
            <label>
              <span className="label">Casual leaves granted yearly</span>
              <input
                className="field"
                type="number"
                min="0"
                step="1"
                value={edit.leavePolicy?.casualGranted ?? 0}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    leavePolicy: {
                      ...edit.leavePolicy,
                      casualGranted: e.target.value,
                    },
                  })
                }
              />
            </label>

            <div className="mt-1 flex justify-end gap-2 border-t border-slate-200 pt-4 sm:col-span-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEdit(null)}
              >
                Cancel
              </button>
              <button disabled={saving} className="btn-primary">
                {saving ? "Saving…" : "Save employee"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
