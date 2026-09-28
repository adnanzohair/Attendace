import { Inbox, X } from "lucide-react";

export const Spinner = () => (
  <div className="grid place-items-center py-16">
    <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-brand-600" />
  </div>
);

/** Page heading block used at the top of every screen. */
export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {children && <div className="toolbar">{children}</div>}
    </div>
  );
}

const badgeTone = (value) => {
  if (/Error|Absent|Missing|Rejected|failed|Disabled/i.test(value)) return "badge-danger";
  if (/Late|Short|Pending/i.test(value)) return "badge-warning";
  if (/Present|Overtime|finalized|Approved|sent|Active/i.test(value)) return "badge-success";
  return "badge-neutral";
};

const dotTone = {
  "badge-danger": "bg-red-500",
  "badge-warning": "bg-amber-500",
  "badge-success": "bg-emerald-500",
  "badge-neutral": "bg-slate-400",
};

export function StatusBadge({ value }) {
  const label = Array.isArray(value) ? value[0] : value;
  const tone = badgeTone(label);
  return (
    <span className={`badge ${tone}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotTone[tone]}`} />
      {label || "—"}
    </span>
  );
}

export function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid animate-fade-in place-items-center bg-slate-900/50 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[92vh] w-full max-w-2xl animate-scale-in flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
          <button type="button" onClick={onClose} className="btn-icon" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export const Empty = ({ text = "No records found" }) => (
  <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
    <div className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-400">
      <Inbox size={20} />
    </div>
    <p className="text-sm font-medium text-slate-500">{text}</p>
  </div>
);

export const fmtTime = (v) =>
  v ? new Date(v).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—";

export const hours = (m) => `${Math.floor((m || 0) / 60)}h ${String((m || 0) % 60).padStart(2, "0")}m`;
