import { useEffect, useState } from "react";
import { AlertCircle, Check, CheckCircle2, Filter, X } from "lucide-react";
import { api, messageOf } from "../services/api";
import { Empty, Modal, PageHeader, Spinner, StatusBadge } from "../components/ui";
import { leaveStatusLabel, leaveTypeLabel } from "../utils/leaveRequestPresentation";

const initialFilters = { status: "pending", type: "", startDate: "", endDate: "" };

export default function LeaveRequests() {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load(nextFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const params = Object.fromEntries(Object.entries(nextFilters).filter(([, value]) => value));
      const { data } = await api.get("/leave-requests", { params });
      setItems(data.data || []);
    } catch (requestError) {
      setError(messageOf(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(initialFilters);
  }, []);

  function openDecision(request, action) {
    const defaultType = ["sick", "casual"].includes(request.requestedType)
      ? request.requestedType
      : "unpaid";
    setDecision({ request, action, approvedType: defaultType, adminNote: "" });
    setError("");
  }

  async function saveDecision(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body =
        decision.action === "approve"
          ? { approvedType: decision.approvedType, adminNote: decision.adminNote }
          : { adminNote: decision.adminNote };
      const { data } = await api.post(
        `/leave-requests/${decision.request._id}/${decision.action}`,
        body,
      );
      setNotice(data.message);
      setDecision(null);
      await load();
    } catch (requestError) {
      const details = requestError.response?.data?.details;
      const suffix = Array.isArray(details)
        ? ` ${details.map((item) => `${item.workDate}: ${item.reason}`).join("; ")}`
        : "";
      setError(`${messageOf(requestError)}${suffix}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Leave requests"
        subtitle="Review employee requests and choose the final paid or unpaid attendance treatment."
      />

      {notice && (
        <div className="alert-success mb-4">
          <CheckCircle2 size={17} className="mt-px shrink-0" />
          <span>{notice}</span>
        </div>
      )}
      {!decision && error && (
        <div className="alert-error mb-4">
          <AlertCircle size={17} className="mt-px shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="card overflow-hidden">
        <form
          className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            load();
          }}
        >
          <label>
            <span className="label">Status</span>
            <select
              className="field"
              value={filters.status}
              onChange={(event) => setFilters({ ...filters, status: event.target.value })}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
          <label>
            <span className="label">Requested type</span>
            <select
              className="field"
              value={filters.type}
              onChange={(event) => setFilters({ ...filters, type: event.target.value })}
            >
              <option value="">All types</option>
              <option value="sick">Sick Leave</option>
              <option value="casual">Casual Leave</option>
              <option value="other">Other Leave</option>
            </select>
          </label>
          <label>
            <span className="label">From</span>
            <input
              className="field"
              type="date"
              value={filters.startDate}
              onChange={(event) => setFilters({ ...filters, startDate: event.target.value })}
            />
          </label>
          <label>
            <span className="label">To</span>
            <input
              className="field"
              type="date"
              min={filters.startDate}
              value={filters.endDate}
              onChange={(event) => setFilters({ ...filters, endDate: event.target.value })}
            />
          </label>
          <button className="btn-secondary">
            <Filter size={16} />
            Apply filters
          </button>
        </form>

        {loading ? (
          <Spinner />
        ) : items.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Requested</th>
                  <th>Dates</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Final treatment</th>
                  <th>HR note</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className="font-medium text-ink">
                        {item.employee?.name || "Unknown employee"}
                      </div>
                      <div className="text-xs text-slate-400">ID {item.employeeId}</div>
                    </td>
                    <td>{leaveTypeLabel(item.requestedType)}</td>
                    <td className="whitespace-nowrap">
                      <div className="font-medium text-ink">{item.startDate}</div>
                      <div className="text-xs text-slate-400">through {item.endDate}</div>
                    </td>
                    <td className="min-w-56 whitespace-normal text-slate-500">{item.reason}</td>
                    <td>
                      <StatusBadge value={leaveStatusLabel(item.status)} />
                    </td>
                    <td>{item.approvedType ? leaveTypeLabel(item.approvedType) : "—"}</td>
                    <td className="min-w-44 whitespace-normal text-slate-500">
                      {item.adminNote || "—"}
                    </td>
                    <td>
                      {item.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            className="btn-primary btn-sm"
                            onClick={() => openDecision(item, "approve")}
                          >
                            <Check size={14} />
                            Approve
                          </button>
                          <button
                            className="btn-secondary btn-sm text-red-700 hover:bg-red-50"
                            onClick={() => openDecision(item, "reject")}
                          >
                            <X size={14} />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="text-right text-slate-300">—</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text="No leave requests match these filters." />
        )}
      </div>

      {decision && (
        <Modal
          title={decision.action === "approve" ? "Approve leave request" : "Reject leave request"}
          onClose={() => setDecision(null)}
        >
          <form onSubmit={saveDecision}>
            <div className="panel text-sm">
              <div className="font-semibold text-ink">
                {decision.request.employee?.name}{" "}
                <span className="font-normal text-slate-400">
                  · ID {decision.request.employeeId}
                </span>
              </div>
              <div className="mt-1 text-slate-600">
                {leaveTypeLabel(decision.request.requestedType)} · {decision.request.startDate}{" "}
                through {decision.request.endDate}
              </div>
              <p className="mt-2.5 border-t border-slate-200 pt-2.5 leading-relaxed text-slate-500">
                {decision.request.reason}
              </p>
            </div>

            {error && (
              <div className="alert-error mt-4">
                <AlertCircle size={17} className="mt-px shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {decision.action === "approve" && (
              <label className="mt-4 block">
                <span className="label">Final attendance treatment</span>
                <select
                  className="field"
                  value={decision.approvedType}
                  onChange={(event) =>
                    setDecision({ ...decision, approvedType: event.target.value })
                  }
                >
                  <option value="sick">Sick Leave (uses paid balance first)</option>
                  <option value="casual">Casual Leave (uses paid balance first)</option>
                  <option value="unpaid">Unpaid Leave (salary deduction)</option>
                </select>
                <span className="hint block">
                  Unused Sick/Casual entitlement is paid. Payroll deducts only excess entitlement
                  or leave explicitly marked Unpaid.
                </span>
              </label>
            )}

            <label className="mt-4 block">
              <span className="label">
                {decision.action === "reject" ? "Rejection reason" : "HR note (optional)"}
              </span>
              <textarea
                className="field min-h-24"
                maxLength="1000"
                value={decision.adminNote}
                onChange={(event) => setDecision({ ...decision, adminNote: event.target.value })}
                required={decision.action === "reject"}
              />
            </label>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
              <button type="button" className="btn-secondary" onClick={() => setDecision(null)}>
                Cancel
              </button>
              <button
                className={decision.action === "approve" ? "btn-primary" : "btn-danger"}
                disabled={busy}
              >
                {busy
                  ? "Saving…"
                  : decision.action === "approve"
                    ? "Approve request"
                    : "Reject request"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
