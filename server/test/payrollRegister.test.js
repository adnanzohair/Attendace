import test from "node:test";
import assert from "node:assert/strict";
import { buildPayrollRegisterFilter, summarizePayroll } from "../src/services/payrollRegister.js";

test("payroll register filter constrains period, status, and escaped employee search", () => {
  const filter = buildPayrollRegisterFilter({
    startDate: "2026-07-25",
    endDate: "2026-08-25",
    status: "published",
    search: "Adnan+101",
  });

  assert.deepEqual(filter.periodStart, { $gte: "2026-07-25" });
  assert.deepEqual(filter.periodEnd, { $lte: "2026-08-25" });
  assert.equal(filter.status, "published");
  assert.equal(filter.$or.length, 2);
  assert.equal(filter.$or[0]["data.employee.name"].$regex.test("Adnan+101"), true);
  assert.equal(filter.$or[0]["data.employee.name"].$regex.test("Adnann101"), false);
});

test("payroll totals stay separated by currency and ignore voided payslips", () => {
  const summary = summarizePayroll([
    { employeeId: "101", status: "published", currency: "PKR", netSalary: 85000, data: { earnings: { totalEarnings: 90000 }, deductions: { total: 5000 } } },
    { employeeId: "102", status: "void", currency: "PKR", netSalary: 75000, data: { earnings: { totalEarnings: 80000 }, deductions: { total: 5000 } } },
    { employeeId: "103", status: "published", currency: "USD", netSalary: 950, data: { earnings: { totalEarnings: 1000 }, deductions: { total: 50 } } },
  ]);

  assert.deepEqual(summary, {
    employeeCount: 2,
    payslipCount: 2,
    currencies: {
      PKR: { gross: 90000, deductions: 5000, net: 85000 },
      USD: { gross: 1000, deductions: 50, net: 950 },
    },
  });
});
