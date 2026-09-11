import test from "node:test";
import assert from "node:assert/strict";
import { payrollDeductionBreakdown } from "../src/utils/payrollDeductionBreakdown.js";

test("groups published deductions into clear payroll categories", () => {
  assert.deepEqual(payrollDeductionBreakdown({
    incomeTax: 1000,
    shortHours: 200,
    lateArrival: 100,
    unpaidLeave: 300,
    personalLoan: 400,
    advanceSalary: 500,
    eobi: 600,
    providentFund: 700,
    professionalTax: 800,
    other: 900,
    total: 5500,
  }), {
    incomeTax: 1000,
    shortHours: 200,
    lateArrival: 100,
    excessLeave: 300,
    personalLoan: 400,
    advanceSalary: 500,
    eobi: 600,
    providentFund: 700,
    professionalTax: 800,
    other: 900,
    total: 5500,
  });
});

test("treats missing deduction values as zero", () => {
  assert.deepEqual(payrollDeductionBreakdown(), {
    incomeTax: 0,
    shortHours: 0,
    lateArrival: 0,
    excessLeave: 0,
    personalLoan: 0,
    advanceSalary: 0,
    eobi: 0,
    providentFund: 0,
    professionalTax: 0,
    other: 0,
    total: 0,
  });
});
