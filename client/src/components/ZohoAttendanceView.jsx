import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  List,
  SlidersHorizontal,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Briefcase,
  UserCheck,
  ChevronDown,
  Sparkles,
  FileText,
} from "lucide-react";

/** Format ISO time or timestamp to 12h time like "09:00 AM" */
const fmt12h = (val) => {
  if (!val) return "00:00";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "00:00";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "00:00";
  }
};

/** Convert total minutes into "09:30" string */
const fmtHours = (mins = 0) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/** Parse YYYY-MM-DD into Day Number (e.g. "05") and Day Name (e.g. "SUN") */
const parseDateParts = (dateStr) => {
  if (!dateStr) return { dayNum: "--", dayName: "---" };
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    return {
      dayNum: String(parts[2]).padStart(2, "0"),
      dayName: dayNames[d.getDay()],
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    };
  }
  return { dayNum: dateStr, dayName: "---" };
};

/**
 * Reusable Zoho People / Zoho Attendance Summary Component
 * Displays tabs, date navigator, view switcher, action button, and timeline rows.
 */
export default function ZohoAttendanceView({
  records = [],
  startDate,
  endDate,
  onDateRangeChange,
  onRequestLeave,
  onRequestCorrection,
}) {
  const [activeTab, setActiveTab] = useState("Attendance Summary");
  const [viewMode, setViewMode] = useState("timeline"); // "timeline" | "table"
  const [showRequestMenu, setShowRequestMenu] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const tabs = [
    "Attendance Summary",
    "Overtime",
    "Regularization",
    "On Duty",
    "Hourly Permission",
    "Shift",
    "Shift Change Request",
  ];

  // Helper to step date range by 7 days
  const stepWeek = (direction) => {
    if (!startDate || !endDate || !onDateRangeChange) return;
    const start = new Date(`${startDate}T12:00:00`);
    const end = new Date(`${endDate}T12:00:00`);
    start.setDate(start.getDate() + direction * 7);
    end.setDate(end.getDate() + direction * 7);

    const fmt = (d) =>
      [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0"),
      ].join("-");

    onDateRangeChange(fmt(start), fmt(end));
  };

  // Format date range for header display (e.g., "05 Jan 2025 - 11 Jan 2025")
  const formatRangeLabel = () => {
    if (!startDate || !endDate) return "Select Range";
    try {
      const s = new Date(`${startDate}T12:00:00`);
      const e = new Date(`${endDate}T12:00:00`);
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const sStr = `${String(s.getDate()).padStart(2, "0")} ${
        monthNames[s.getMonth()]
      } ${s.getFullYear()}`;
      const eStr = `${String(e.getDate()).padStart(2, "0")} ${
        monthNames[e.getMonth()]
      } ${e.getFullYear()}`;
      return `${sStr} - ${eStr}`;
    } catch {
      return `${startDate} - ${endDate}`;
    }
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200/90 bg-white shadow-sm font-sans text-slate-800">
      {/* 1. Zoho Sub-Navigation Tabs Bar */}
      <div className="border-b border-slate-200 bg-white px-5 pt-3">
        <div className="flex gap-6 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative pb-3 text-xs font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? "text-[#0091ff] font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-t-full bg-[#0091ff]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Zoho Toolbar: Date Controls & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 p-4">
        {/* Date Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => stepWeek(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-50 active:scale-95 transition"
            title="Previous Week"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs">
            <CalendarIcon size={14} className="text-slate-400" />
            <span>{formatRangeLabel()}</span>
          </div>
          <button
            onClick={() => stepWeek(1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-50 active:scale-95 transition"
            title="Next Week"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* View Switcher & Request Button */}
        <div className="flex items-center gap-3">
          {/* View Toggles */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-xs">
            <button
              onClick={() => setViewMode("timeline")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                viewMode === "timeline"
                  ? "bg-blue-50 text-[#0091ff]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Timeline View"
            >
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">Timeline</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                viewMode === "table"
                  ? "bg-blue-50 text-[#0091ff]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="List View"
            >
              <List size={14} />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          {/* Request Button Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRequestMenu(!showRequestMenu)}
              className="flex items-center gap-1.5 rounded-lg bg-[#0091ff] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#007fe0] active:scale-95 transition"
            >
              <span>Request</span>
              <ChevronDown size={14} />
            </button>

            {showRequestMenu && (
              <div className="absolute right-0 z-30 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl animate-fade-in">
                <button
                  onClick={() => {
                    setShowRequestMenu(false);
                    onRequestLeave && onRequestLeave();
                  }}
                  className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Briefcase size={14} className="text-indigo-500" />
                  Apply Leave
                </button>
                <button
                  onClick={() => {
                    setShowRequestMenu(false);
                    onRequestCorrection && onRequestCorrection();
                  }}
                  className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Clock size={14} className="text-amber-500" />
                  Request Punch Correction
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Body: Timeline View vs Table View */}
      {viewMode === "timeline" ? (
        <div className="divide-y divide-slate-100 p-2 sm:p-5">
          {records.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No attendance entries found for this period.
            </div>
          ) : (
            records.map((rec) => {
              const { dayNum, dayName, isWeekend } = parseDateParts(rec.date);
              const isAbsent =
                rec.status === "Absent" ||
                rec.conditions?.includes("Absent") ||
                rec.type === "absent";
              const isHoliday =
                rec.status?.includes("Holiday") || rec.type === "holiday";
              const isLeave =
                rec.leaveType || rec.status?.includes("Leave");
              const isPresent =
                (rec.totalMinutes > 0 || rec.checkIn) && !isAbsent && !isWeekend && !isHoliday;

              // Timeline line color styles matching Zoho reference
              let lineColor = "bg-emerald-500";
              let dotColor = "bg-emerald-500";
              let badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
              let badgeText = "Office-in";

              if (isWeekend) {
                lineColor = "bg-amber-300";
                dotColor = "bg-amber-400";
                badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
                badgeText = "Weekend";
              } else if (isHoliday) {
                lineColor = "bg-[#f26322]";
                dotColor = "bg-[#f26322]";
                badgeStyle = "bg-orange-50 text-[#f26322] border-orange-200";
                badgeText = rec.status || "Holiday";
              } else if (isAbsent) {
                lineColor = "bg-rose-400";
                dotColor = "bg-rose-500";
                badgeStyle = "bg-rose-50 text-rose-700 border-rose-200";
                badgeText = "Absent";
              } else if (isLeave) {
                lineColor = "bg-indigo-400";
                dotColor = "bg-indigo-500";
                badgeStyle = "bg-indigo-50 text-indigo-700 border-indigo-200";
                badgeText = rec.status || "Leave";
              } else if (rec.conditions?.includes("Remote")) {
                lineColor = "bg-cyan-500";
                dotColor = "bg-cyan-500";
                badgeStyle = "bg-cyan-50 text-cyan-700 border-cyan-200";
                badgeText = "Remote-in";
              } else {
                badgeText = rec.status === "Present" ? "Office-in" : rec.status || "Office-in";
              }

              const inTimeStr = fmt12h(rec.checkIn);
              const outTimeStr = fmt12h(rec.checkOut);

              return (
                <div
                  key={rec.date || rec.id}
                  onClick={() => setSelectedRecord(rec)}
                  className="group flex flex-col gap-3 rounded-xl py-4 px-3 transition-colors hover:bg-slate-50/80 sm:flex-row sm:items-center sm:gap-6 cursor-pointer"
                >
                  {/* Date Column (Day Num + Day Name) */}
                  <div className="flex w-16 shrink-0 flex-col items-start leading-tight">
                    <span className="text-base font-bold text-slate-800">
                      {dayNum}
                    </span>
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                      {dayName}
                    </span>
                  </div>

                  {/* Clock In Time */}
                  <div className="w-20 shrink-0 text-xs font-bold text-slate-700 text-left">
                    {isPresent ? inTimeStr : isAbsent || isWeekend || isHoliday ? "00:00" : inTimeStr}
                  </div>

                  {/* Timeline Bar with Dots & Status Badge (The Core Graphic) */}
                  <div className="relative flex flex-1 items-center px-2">
                    {/* Left Dot */}
                    <span className={`h-2.5 w-2.5 rounded-full ${dotColor} shrink-0 ring-2 ring-white shadow-xs`} />

                    {/* Left Connector Line */}
                    <span className={`h-[2px] flex-1 ${lineColor}`} />

                    {/* Centered Status Badge Pill */}
                    <span
                      className={`mx-2 inline-flex items-center justify-center rounded-md border px-3 py-0.5 text-xs font-medium shadow-2xs whitespace-nowrap ${badgeStyle}`}
                    >
                      {badgeText}
                    </span>

                    {/* Right Connector Line */}
                    <span className={`h-[2px] flex-1 ${lineColor}`} />

                    {/* Right Dot */}
                    <span className={`h-2.5 w-2.5 rounded-full ${dotColor} shrink-0 ring-2 ring-white shadow-xs`} />
                  </div>

                  {/* Clock Out Time */}
                  <div className="w-20 shrink-0 text-xs font-bold text-slate-700 text-right">
                    {isPresent ? outTimeStr : isAbsent || isWeekend || isHoliday ? "00:00" : outTimeStr}
                  </div>

                  {/* Total Worked Hours Column */}
                  <div className="flex w-28 shrink-0 flex-col items-end leading-tight text-right">
                    <span className="text-xs font-bold text-slate-800">
                      {fmtHours(rec.totalMinutes)}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      Hrs Worked
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Clock In</th>
                <th className="p-3">Clock Out</th>
                <th className="p-3">Worked</th>
                <th className="p-3">Required</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((rec) => (
                <tr key={rec.date || rec.id} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-800">{rec.date}</td>
                  <td className="p-3 text-slate-600">{fmt12h(rec.checkIn)}</td>
                  <td className="p-3 text-slate-600">{fmt12h(rec.checkOut)}</td>
                  <td className="p-3 font-bold text-slate-800">{fmtHours(rec.totalMinutes)}</td>
                  <td className="p-3 text-slate-500">{fmtHours(rec.requiredMinutes || 480)}</td>
                  <td className="p-3">
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-700">
                      {rec.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Slideout / Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Attendance Details
                </div>
                <div className="text-lg font-bold text-slate-800">
                  {selectedRecord.date}
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Clock In</span>
                <span className="font-semibold text-slate-800">{fmt12h(selectedRecord.checkIn)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Clock Out</span>
                <span className="font-semibold text-slate-800">{fmt12h(selectedRecord.checkOut)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Total Worked</span>
                <span className="font-bold text-emerald-600">{fmtHours(selectedRecord.totalMinutes)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Required Hours</span>
                <span className="font-medium text-slate-700">{fmtHours(selectedRecord.requiredMinutes || 480)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Overtime</span>
                <span className="font-medium text-slate-700">{fmtHours(selectedRecord.overtimeMinutes || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Shortage</span>
                <span className="font-medium text-slate-700">{fmtHours(selectedRecord.shortMinutes || 0)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Status</span>
                <span className="font-bold text-slate-800">{selectedRecord.status}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
