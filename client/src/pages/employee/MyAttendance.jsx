import { useEffect, useState } from "react";
import { api, messageOf } from "../../services/api";
import { Spinner, Modal } from "../../components/ui";
import { currentPayrollMonth, payrollPeriodForMonth } from "../../utils/payrollPeriod";
import ZohoAttendanceView from "../../components/ZohoAttendanceView";
import { useNavigate } from "react-router-dom";

/** Helper to generate full timeline array covering all days including weekends */
function prepareTimelineRecords(startDateStr, endDateStr, apiRecords = []) {
  if (!startDateStr || !endDateStr) return apiRecords;
  const recordsMap = new Map();
  apiRecords.forEach((r) => recordsMap.set(r.date, r));

  const days = [];
  const start = new Date(`${startDateStr}T12:00:00`);
  const end = new Date(`${endDateStr}T12:00:00`);
  const DAY = 86400000;

  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + DAY)) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dateKey = `${yyyy}-${mm}-${dd}`;
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const existing = recordsMap.get(dateKey);
    if (existing) {
      days.push({
        ...existing,
        date: dateKey,
        isWeekend,
      });
    } else if (isWeekend) {
      days.push({
        id: `weekend-${dateKey}`,
        date: dateKey,
        checkIn: null,
        checkOut: null,
        totalMinutes: 0,
        requiredMinutes: 0,
        shortMinutes: 0,
        overtimeMinutes: 0,
        lateMinutes: 0,
        earlyDepartureMinutes: 0,
        status: "Weekend",
        conditions: ["Weekend"],
        isWeekend: true,
      });
    } else {
      days.push({
        id: `absent-${dateKey}`,
        date: dateKey,
        checkIn: null,
        checkOut: null,
        totalMinutes: 0,
        requiredMinutes: 480,
        shortMinutes: 480,
        overtimeMinutes: 0,
        lateMinutes: 0,
        earlyDepartureMinutes: 0,
        status: "Absent",
        conditions: ["Absent"],
        isWeekend: false,
      });
    }
  }

  return days;
}

export default function MyAttendance() {
  const initialMonth = currentPayrollMonth();
  const initialPeriod = payrollPeriodForMonth(initialMonth);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("month");
  const [payMonth, setPayMonth] = useState(initialMonth);
  const [startDate, setStart] = useState(initialPeriod.startDate);
  const [endDate, setEnd] = useState(initialPeriod.endDate);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function fetchAttendance(sDate, eDate, mMode = mode, mMonth = payMonth) {
    setLoading(true);
    try {
      const params = mMode === "month" ? { month: mMonth } : { startDate: sDate, endDate: eDate };
      const response = await api.get("/employee-portal/attendance", { params });
      setData(response.data);
      setError("");
    } catch (requestError) {
      setError(messageOf(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAttendance(startDate, endDate);
  }, []);

  const handleDateRangeChange = (newStart, newEnd) => {
    setMode("custom");
    setStart(newStart);
    setEnd(newEnd);
    fetchAttendance(newStart, newEnd, "custom");
  };

  const activePeriodStart = data?.period?.startDate || startDate;
  const activePeriodEnd = data?.period?.endDate || endDate;
  const timelineRecords = prepareTimelineRecords(
    activePeriodStart,
    activePeriodEnd,
    data?.records || []
  );

  return (
    <div className="space-y-5">
      {/* Date Filter Bar */}
      <div className="card flex flex-wrap items-end justify-between gap-4 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label>
            <span className="label">View by</span>
            <select
              className="field"
              value={mode}
              onChange={(e) => {
                const newMode = e.target.value;
                setMode(newMode);
                if (newMode === "month") {
                  const p = payrollPeriodForMonth(payMonth);
                  setStart(p.startDate);
                  setEnd(p.endDate);
                  fetchAttendance(p.startDate, p.endDate, "month", payMonth);
                }
              }}
            >
              <option value="month">Payroll month</option>
              <option value="custom">Custom range</option>
            </select>
          </label>

          {mode === "month" ? (
            <label>
              <span className="label">Payroll month</span>
              <input
                className="field"
                type="month"
                value={payMonth}
                onChange={(e) => {
                  const val = e.target.value;
                  setPayMonth(val);
                  const p = payrollPeriodForMonth(val);
                  setStart(p.startDate);
                  setEnd(p.endDate);
                  fetchAttendance(p.startDate, p.endDate, "month", val);
                }}
              />
            </label>
          ) : (
            <>
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
                  onChange={(e) => setEnd(e.target.value)}
                />
              </label>
              <button
                className="btn-primary py-2.5"
                onClick={() => fetchAttendance(startDate, endDate, "custom")}
              >
                Apply Range
              </button>
            </>
          )}
        </div>

        <div className="text-xs font-semibold text-slate-500">
          Showing {timelineRecords.length} days
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="flex py-12 justify-center">
          <Spinner />
        </div>
      ) : (
        <ZohoAttendanceView
          records={timelineRecords}
          startDate={activePeriodStart}
          endDate={activePeriodEnd}
          onDateRangeChange={handleDateRangeChange}
          onRequestLeave={() => navigate("/employee/leave")}
          onRequestCorrection={() => navigate("/employee/leave")}
        />
      )}
    </div>
  );
}
