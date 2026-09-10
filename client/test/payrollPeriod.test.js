import test from "node:test";
import assert from "node:assert/strict";
import {
  currentPayrollMonth,
  payrollPeriodForMonth,
} from "../src/utils/payrollPeriod.js";

test("maps August payroll to July 25 through August 25", () => {
  assert.deepEqual(payrollPeriodForMonth("2026-08"), {
    startDate: "2026-07-25",
    endDate: "2026-08-25",
  });
});

test("moves dates after the 25th into the following payroll month", () => {
  assert.equal(currentPayrollMonth(new Date(2026, 7, 25, 12)), "2026-08");
  assert.equal(currentPayrollMonth(new Date(2026, 7, 26, 12)), "2026-09");
});
