import test from "node:test";
import assert from "node:assert/strict";
import { approvedLeaveValues, attendanceLeaveConflict } from "../src/services/approvedLeaveAttendance.js";

const employee = { _id: "employee-1", employeeId: "101" };
const shift = { _id: "shift-1", startTime: "14:30", endTime: "23:00", expectedMinutes: 510, gracePeriodMinutes: 15 };

test("approved casual leave creates a paid reviewed attendance record", () => {
  const values = approvedLeaveValues({ employee, shift, workDate: "2026-09-14", approvedType: "casual", leaveRequest: "request-1" });
  assert.equal(values.employeeId, "101");
  assert.equal(values.leaveType, "casual");
  assert.deepEqual(values.conditions, ["Leave", "Approved Leave", "Casual Leave"]);
  assert.equal(values.actualMinutes, 0);
  assert.equal(values.shortMinutes, 0);
  assert.equal(values.workflow, "reviewed");
  assert.equal(values.leaveRequest, "request-1");
});

test("unpaid approval is clearly classified for payroll", () => {
  const values = approvedLeaveValues({ employee, shift, workDate: "2026-09-14", approvedType: "unpaid", leaveRequest: "request-1" });
  assert.equal(values.leaveType, "unpaid");
  assert.equal(values.status, "Approved Unpaid Leave");
  assert.ok(values.conditions.includes("Unpaid Leave"));
});

test("approval blocks finalized or punched attendance but may replace a plain absence", () => {
  assert.match(attendanceLeaveConflict({ workflow: "finalized", conditions: ["Absent"] }), /finalized/i);
  assert.match(attendanceLeaveConflict({ workflow: "processed", actualClockIn: new Date(), conditions: ["Present"] }), /punch/i);
  assert.equal(attendanceLeaveConflict({ workflow: "processed", actualClockIn: null, actualClockOut: null, conditions: ["Absent"] }), null);
});
