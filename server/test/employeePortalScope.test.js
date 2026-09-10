import test from "node:test";
import assert from "node:assert/strict";
import { payrollPeriodForMonth, currentPayrollMonth } from "../src/services/payrollPeriod.js";
import { employeeAttendanceFilter } from "../src/routes/employeePortal.js";

test("August payroll month runs July 25 through August 25", () => {
  assert.deepEqual(payrollPeriodForMonth("2026-08"), { label: "August 2026", startDate: "2026-07-25", endDate: "2026-08-25" });
});
test("dates after the 25th belong to the next payroll month", () => {
  assert.equal(currentPayrollMonth(new Date("2026-08-26T12:00:00Z")), "2026-09");
});
test("attendance filter always uses authenticated employee ID", () => {
  assert.deepEqual(employeeAttendanceFilter({ employeeId: "101" }, "2026-07-25", "2026-08-25"), { employeeId: "101", workDate: { $gte: "2026-07-25", $lte: "2026-08-25" } });
});
