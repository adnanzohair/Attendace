import test from "node:test";
import assert from "node:assert/strict";

async function taxCalculator() {
  try { return await import("../src/services/pakistanIncomeTax.js"); }
  catch (error) { assert.fail(`Pakistan income-tax calculator is unavailable: ${error.message}`); }
}

test("calculates PKR 400 monthly tax for PKR 90,000 salary in Tax Year 2027", async () => {
  const { calculatePakistanSalaryTax } = await taxCalculator();
  assert.deepEqual(calculatePakistanSalaryTax(90000, "2026-08-25"), { taxYear: 2027, annualTaxableSalary: 1080000, annualTax: 4800, monthlyTax: 400 });
});

test("calculates every Tax Year 2027 salaried slab boundary", async () => {
  const { annualSalaryTax2027 } = await taxCalculator();
  const cases = [[600000, 0], [1200000, 6000], [2200000, 116000], [3200000, 316000], [4100000, 541000], [5600000, 976000], [7000000, 1424000], [8000000, 1774000]];
  for (const [salary, expectedTax] of cases) assert.equal(annualSalaryTax2027(salary), expectedTax, `annual salary ${salary}`);
});

test("refuses to apply Tax Year 2027 rates outside their effective period", async () => {
  const { calculatePakistanSalaryTax } = await taxCalculator();
  assert.throws(() => calculatePakistanSalaryTax(90000, "2026-06-30"), /supported only for payslip periods ending/);
  assert.throws(() => calculatePakistanSalaryTax(90000, "2027-07-01"), /supported only for payslip periods ending/);
});

test("rejects negative or invalid salary", async () => {
  const { calculatePakistanSalaryTax } = await taxCalculator();
  assert.throws(() => calculatePakistanSalaryTax(-1, "2026-08-25"), /Monthly salary/);
  assert.throws(() => calculatePakistanSalaryTax("invalid", "2026-08-25"), /Monthly salary/);
});
