import test from "node:test";
import assert from "node:assert/strict";
import { createPublishedSnapshot, employeePayslipFilter } from "../src/services/payslipPublication.js";

test("published snapshot is detached from later calculation changes", () => {
  const source = { employee: { _id: "e1", employeeId: "101", name: "A" }, period: { startDate: "2026-07-25", endDate: "2026-08-25" }, earnings: { totalEarnings: 100 }, netSalary: 90 };
  const snapshot = createPublishedSnapshot(source);
  source.earnings.totalEarnings = 999;
  assert.equal(snapshot.data.earnings.totalEarnings, 100);
  assert.equal(snapshot.employeeId, "101");
});
test("employee payslip filter combines ownership and non-void state", () => {
  assert.deepEqual(employeePayslipFilter("employee-db-id", "slip-id"), { _id: "slip-id", employee: "employee-db-id", status: "published" });
});
