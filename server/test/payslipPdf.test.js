import test from "node:test";
import assert from "node:assert/strict";

async function renderer() {
  try {
    return await import("../src/services/payslipPdf.js");
  } catch (error) {
    assert.fail(`Payslip PDF renderer is unavailable: ${error.message}`);
  }
}

function fixture(currency) {
  const usd = currency === "USD";
  return {
    company: { name: "BIZTEK PROFESSIONALS" },
    employee: {
      employeeId: "101",
      name: "Adnan Zohair",
      email: "employee@example.com",
      designation: "Backend Developer",
      department: "Developer",
      salaryCurrency: currency,
    },
    period: { startDate: "2026-07-25", endDate: "2026-08-25" },
    payment: { mode: "Transfer", calendarDays: 32 },
    policy: { dynamicWorkingDays: 22 },
    leaveSummary: {
      sick: { granted: 8, usedInPeriod: 1, remaining: 7, excessInPeriod: 0 },
      casual: { granted: 8, usedInPeriod: 1, remaining: 7, excessInPeriod: 0 },
      unpaidDaysInPeriod: 0,
    },
    earnings: {
      directSalary: usd ? 1000 : 0,
      basicSalary: usd ? 0 : 45000,
      accommodationAllowance: usd ? 0 : 22500,
      conveyanceAllowance: usd ? 0 : 11250,
      medicalAllowance: usd ? 0 : 11250,
      overtimePay: 0,
      incentive: 0,
      yearlyBonus: 0,
      loanGiven: 0,
      medicalReimbursement: 0,
      arrears: 0,
      totalEarnings: usd ? 1000 : 90000,
    },
    deductions: {
      incomeTax: usd ? 0 : 400,
      unpaidLeave: 0,
      shortHours: 0,
      lateArrival: 0,
      personalLoan: 0,
      advanceSalary: 0,
      professionalTax: 0,
      eobi: 0,
      providentFund: 0,
      other: 0,
      total: usd ? 0 : 400,
      incomeTaxCalculated: usd ? 0 : 400,
      incomeTaxOverridden: false,
      unpaidLeaveOverridden: false,
      shortHoursCalculated: 0,
      shortHoursOverridden: false,
    },
    others: { personalLoanBalance: 0, motorVehicleLoanBalance: 0, withholdingTax: 0, oldPfBalance: 0, newPfBalance: 0, employeePfShare: 0, employerPfShare: 0, pfWithdrawal: 0 },
    attendance: {
      presentDays: 20,
      absentDays: 0,
      leaveDays: 2,
      actualMinutes: 10200,
      shortMinutes: 0,
      lateMinutes: 0,
      overtimeMinutes: 0,
    },
    attendanceAnalysis: { shortMinutes: 0, daysOver30Late: 0, absentDays: 0, incompleteAttendanceDays: 0, workFromHomeDays: 0 },
    tax: usd ? null : { taxYear: "2026-27", monthlyTax: 400, annualTaxableSalary: 1080000, annualTax: 4800, appliedMonthlyTax: 400, overridden: false },
    netSalary: usd ? 1000 : 89600,
  };
}

test("PDF view model contains every section shown by the portal payslip", async () => {
  const { buildPayslipPdfModel } = await renderer();
  assert.equal(typeof buildPayslipPdfModel, "function");
  const model = buildPayslipPdfModel(fixture("PKR"));
  assert.deepEqual(model.sectionTitles, ["EARNINGS", "DEDUCTIONS", "OTHERS"]);
  assert.deepEqual(model.info.map(([label]) => label), [
    "Name", "Number of Days", "Payroll Working Days", "Designation",
    "Mode of Payment", "Department", "Sick Leaves", "Employee ID",
    "Salary Currency", "Casual Leaves",
  ]);
  assert.ok(model.earnings.some(([label]) => label === "Loan Given"));
  assert.ok(model.deductions.some(([label]) => label === "Short Hours"));
  assert.ok(model.others.some(([label]) => label === "PF Withdrawal"));
  assert.deepEqual(model.metrics.map(([label]) => label), [
    "Short Hours", "Over 30 Minutes Late", "Absents For Month",
    "Incomplete Attendance", "Work From Home",
  ]);
});

test("PDF view model marks manual deduction adjustments", async () => {
  const { buildPayslipPdfModel } = await renderer();
  const payslip = fixture("PKR");
  payslip.deductions.shortHoursOverridden = true;
  payslip.deductions.incomeTaxOverridden = true;
  payslip.deductions.unpaidLeaveOverridden = true;
  const labels = buildPayslipPdfModel(payslip).deductions.map(([label]) => label);
  assert.ok(labels.includes("Income Tax At Source** (adjusted)"));
  assert.ok(labels.includes("Short Hours (adjusted)"));
  assert.ok(labels.includes("Excess Leave (adjusted)"));
});

for (const currency of ["PKR", "USD"]) {
  test(`renders a non-empty ${currency} payslip PDF`, async () => {
    const { renderPayslipPdf, payslipPdfIdentity } = await renderer();
    const payslip = fixture(currency);
    const pdf = await renderPayslipPdf(payslip);
    assert.ok(Buffer.isBuffer(pdf));
    assert.ok(pdf.length > 1000);
    assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
    assert.deepEqual(payslipPdfIdentity(payslip), {
      employeeName: "Adnan Zohair",
      currency,
    });
  });
}
