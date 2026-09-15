import { calculateAttendance } from "./attendanceProcessor.js";

const labels = {
  sick: "Sick Leave",
  casual: "Casual Leave",
  unpaid: "Unpaid Leave",
};

export function approvedLeaveValues({ employee, shift, workDate, approvedType, leaveRequest }) {
  const base = calculateAttendance({ employee, shift, workDate, punches: [] });
  const label = labels[approvedType];
  if (!label) throw new Error("Approved leave type is invalid");
  return {
    ...base,
    actualClockIn: null,
    actualClockOut: null,
    actualMinutes: 0,
    lateMinutes: 0,
    earlyLeaveMinutes: 0,
    shortMinutes: 0,
    overtimeMinutes: 0,
    conditions: ["Leave", "Approved Leave", label],
    status: `Approved ${label}`,
    leaveType: approvedType,
    workflow: "reviewed",
    sourcePunchIds: [],
    manuallyAdjusted: true,
    adjustmentReason: "Approved employee leave request",
    leaveRequest,
  };
}

export function attendanceLeaveConflict(attendance) {
  if (!attendance) return null;
  if (attendance.workflow === "finalized") return "Attendance is finalized";
  if (attendance.actualClockIn || attendance.actualClockOut || attendance.sourcePunchIds?.length) return "Attendance contains clock punches";
  const plainAbsence = attendance.conditions?.includes("Absent") && !attendance.conditions?.includes("Leave") && !attendance.manuallyAdjusted;
  return plainAbsence ? null : "Attendance already contains a manual or leave record";
}
