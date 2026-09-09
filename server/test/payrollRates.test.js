import test from "node:test";
import assert from "node:assert/strict";

async function ratesCalculator() {
  try {
    return await import("../src/services/payrollRates.js");
  } catch (error) {
    assert.fail(`Dynamic payroll-rate calculator is unavailable: ${error.message}`);
  }
}

test("uses working days from the selected period as the salary divisor", async () => {
  const { calculatePayrollRates } = await ratesCalculator();
  const rates = calculatePayrollRates(90000, 20, 10200);
  assert.equal(rates.dailyRate, 4500);
  assert.equal(rates.averageExpectedMinutes, 510);
  assert.equal(rates.minuteRate, 4500 / 510);
});

test("returns zero rates when the selected period has no working days", async () => {
  const { calculatePayrollRates } = await ratesCalculator();
  assert.deepEqual(calculatePayrollRates(90000, 0, 0), {
    dailyRate: 0,
    averageExpectedMinutes: 0,
    minuteRate: 0,
  });
});
