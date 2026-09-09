import test from "node:test";
import assert from "node:assert/strict";

async function calculator() {
  try { return (await import("../src/services/payrollCalculator.js")).applyShortHoursOverride; }
  catch (error) { assert.fail(`Payroll override calculator is unavailable: ${error.message}`); }
}

test("uses the exact calculated short-hours deduction when override is blank", async () => {
  const apply = await calculator();
  assert.deepEqual(apply(1500.456, ""), { calculated: 1500.46, applied: 1500.46, overridden: false });
});

test("allows zero to override a calculated short-hours deduction", async () => {
  const apply = await calculator();
  assert.deepEqual(apply(1500, "0"), { calculated: 1500, applied: 0, overridden: true });
});

test("uses a manually entered short-hours deduction without changing calculated amount", async () => {
  const apply = await calculator();
  assert.deepEqual(apply(1500, "925.25"), { calculated: 1500, applied: 925.25, overridden: true });
});

test("rejects an invalid short-hours override", async () => {
  const apply = await calculator();
  assert.throws(() => apply(1500, "not-a-number"), /Short-hours deduction override/);
  assert.throws(() => apply(1500, "-1"), /Short-hours deduction override/);
});

test("keeps calculated income tax unless a payslip override is supplied", async () => {
  const { applyIncomeTaxOverride } = await import("../src/services/payrollCalculator.js");
  assert.deepEqual(applyIncomeTaxOverride(400, ""), { calculated: 400, applied: 400, overridden: false });
  assert.deepEqual(applyIncomeTaxOverride(400, "463"), { calculated: 400, applied: 463, overridden: true });
});

test("allows HR to override the unpaid-leave deduction for one payslip", async () => {
  const { applyUnpaidLeaveOverride } = await import("../src/services/payrollCalculator.js");
  assert.deepEqual(applyUnpaidLeaveOverride(8181.82, ""), { calculated: 8181.82, applied: 8181.82, overridden: false });
  assert.deepEqual(applyUnpaidLeaveOverride(8181.82, "4000"), { calculated: 8181.82, applied: 4000, overridden: true });
});
