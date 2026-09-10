import { Router } from "express";
import { Attendance, Employee, Holiday, PayslipEmailLog, PublishedPayslip, Settings } from "../models/index.js";
import { AppError, asyncHandler } from "../utils/http.js";
import { applyIncomeTaxOverride, applyShortHoursOverride, applyUnpaidLeaveOverride } from "../services/payrollCalculator.js";
import { calculatePakistanSalaryTax } from "../services/pakistanIncomeTax.js";
import { buildPayStructure } from "../services/payStructure.js";
import { calculatePayrollRates } from "../services/payrollRates.js";
import { calculateLeaveEntitlement } from "../services/leaveEntitlement.js";
import { renderPayslipPdf } from "../services/payslipPdf.js";
import { createPayslipMailer } from "../services/payslipMailer.js";
import { publicMailStatus } from "../config/mail.js";
import { createPublishedSnapshot } from "../services/payslipPublication.js";

const r = Router();
const DAY = 86400000;
const dateKey = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
const expectedMinutes = (day) => day === 5 ? 480 : 510;
const money = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
const amount = (value, name) => {
  if (value === undefined || value === "") return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new AppError(422, `${name} must be zero or a positive number`);
  return parsed;
};

function defaultPeriod() {
  const now = new Date(), start = new Date(now.getFullYear(), now.getMonth(), 25), end = new Date(now.getFullYear(), now.getMonth() + 1, 25);
  return { startDate: dateKey(start), endDate: dateKey(end) };
}

export async function calculatePayslip(employeeId, query = {}) {
  const employee = await Employee.findById(employeeId).lean();
  if (!employee) throw new AppError(404, "Employee not found");
  const defaults = defaultPeriod(), start = query.startDate || defaults.startDate, end = query.endDate || defaults.endDate;
  const startDate = new Date(`${start}T12:00:00`), endDate = new Date(`${end}T12:00:00`);
  if (Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf()) || startDate > endDate) throw new AppError(422, "Choose a valid date range");
  if ((endDate - startDate) / DAY > 366) throw new AppError(422, "Payslip date range cannot exceed one year");

  const leaveYear = end.slice(0, 4), leaveYearStart = `${leaveYear}-01-01`;
  const [records, yearlyHolidays, settings, yearlyRecords] = await Promise.all([
    Attendance.find({ employeeId: employee.employeeId, workDate: { $gte: start, $lte: end } }).lean(),
    Holiday.find({ date: { $gte: leaveYearStart, $lte: end }, active: true }).lean(),
    Settings.findOne({ key: "global" }).lean(),
    Attendance.find({ employeeId: employee.employeeId, workDate: { $gte: leaveYearStart, $lte: end } }).select("leaveType conditions workDate").lean(),
  ]);
  const byDate = new Map(records.map((record) => [record.workDate, record]));
  const holidayDates = new Set(yearlyHolidays.map((holiday) => holiday.date));
  const joiningDate = employee.joiningDate ? dateKey(new Date(employee.joiningDate)) : null;
  const days = [];
  for (let date = new Date(startDate); date <= endDate; date = new Date(date.getTime() + DAY)) {
    const day = date.getDay(), workDate = dateKey(date);
    if (day === 0 || day === 6 || holidayDates.has(workDate) || (joiningDate && workDate < joiningDate)) continue;
    const record = byDate.get(workDate), isLeave = record?.conditions?.includes("Leave"), absent = !record && !isLeave;
    days.push({ workDate, expectedMinutes: record?.expectedMinutes || expectedMinutes(day), actualMinutes: record?.actualMinutes || 0, lateMinutes: record?.lateMinutes || 0, shortMinutes: record?.shortMinutes || 0, overtimeMinutes: record?.overtimeMinutes || 0, absent, leave: Boolean(isLeave) });
  }

  const workingDays = days.length, presentDays = days.filter((day) => day.actualMinutes > 0).length;
  const absentDays = days.filter((day) => day.absent).length, leaveDays = days.filter((day) => day.leave).length;
  const sum = (field, predicate = () => true) => days.filter(predicate).reduce((total, day) => total + day[field], 0);
  const actual = sum("actualMinutes"), expected = sum("expectedMinutes"), late = sum("lateMinutes"), overtime = sum("overtimeMinutes");
  const short = sum("shortMinutes", (day) => !day.absent && !day.leave);
  const payroll = settings?.payroll || {};
  const salary = Number(employee.monthlySalary) || 0, payStructure = buildPayStructure(salary, employee.salaryCurrency);
  const allowsAutomaticAdjustments = payStructure.allowsAutomaticAdjustments;
  const allowsManualAdjustments = payStructure.allowsManualAdjustments;
  const { dailyRate, averageExpectedMinutes: averageExpected, minuteRate } = calculatePayrollRates(salary, workingDays, expected);
  const yearlyByDate = new Map(yearlyRecords.map((record) => [record.workDate, record]));
  const leaveEvents = [];
  for (let date = new Date(`${leaveYearStart}T12:00:00`); date <= endDate; date = new Date(date.getTime() + DAY)) {
    const day = date.getDay(), workDate = dateKey(date);
    if (day === 0 || day === 6 || holidayDates.has(workDate) || (joiningDate && workDate < joiningDate)) continue;
    const record = yearlyByDate.get(workDate);
    if (record?.leaveType === "sick" || record?.conditions?.includes("Sick Leave")) leaveEvents.push({ workDate, type: "sick" });
    else if (record?.leaveType === "casual" || record?.conditions?.includes("Casual Leave")) leaveEvents.push({ workDate, type: "casual" });
    else if (record?.conditions?.includes("Absent") || (!record && workDate >= start)) leaveEvents.push({ workDate, type: "absent" });
  }
  const leaveSummary = calculateLeaveEntitlement({ sickGranted: employee.leavePolicy?.sickGranted, casualGranted: employee.leavePolicy?.casualGranted, periodStart: start, periodEnd: end, events: leaveEvents });
  const lateEnabled = employee.payrollSettings?.lateDeductionOverride === "enabled" || (employee.payrollSettings?.lateDeductionOverride !== "disabled" && payroll.deductLateHours);
  const absenceDeduction = 0;
  const calculatedUnpaidLeaveDeduction = allowsAutomaticAdjustments ? leaveSummary.unpaidDaysInPeriod * dailyRate : 0;
  const unpaidLeaveOverride = !allowsAutomaticAdjustments || query.unpaidLeaveOverride === undefined || query.unpaidLeaveOverride === "" ? "" : amount(query.unpaidLeaveOverride, "Unpaid-leave deduction override");
  const unpaidLeaveDeduction = applyUnpaidLeaveOverride(calculatedUnpaidLeaveDeduction, unpaidLeaveOverride);
  const lateDeduction = allowsAutomaticAdjustments && lateEnabled ? late * minuteRate : 0;
  const chargeableShort = lateEnabled ? Math.max(0, short - late) : short;
  const calculatedShortDeduction = !allowsAutomaticAdjustments || payroll.deductShortHours === false ? 0 : chargeableShort * minuteRate;
  const shortOverride = !allowsAutomaticAdjustments || query.shortHoursOverride === undefined || query.shortHoursOverride === "" ? "" : amount(query.shortHoursOverride, "Short-hours deduction override");
  const shortDeduction = applyShortHoursOverride(calculatedShortDeduction, shortOverride);
  let calculatedTax = null;
  if (payStructure.pakistanIncomeTaxApplicable) {
    try {
      calculatedTax = calculatePakistanSalaryTax(salary, end);
    } catch (error) {
      throw new AppError(422, error.message);
    }
  }
  const incomeTaxOverride = !allowsAutomaticAdjustments || query.incomeTaxOverride === undefined || query.incomeTaxOverride === "" ? "" : amount(query.incomeTaxOverride, "Income-tax deduction override");
  const incomeTax = applyIncomeTaxOverride(calculatedTax?.monthlyTax || 0, incomeTaxOverride);
  const overtimePay = allowsAutomaticAdjustments && payroll.payOvertime && employee.payrollSettings?.overtimeEligible ? overtime * minuteRate : 0;
  const optionalAmount = (value, name) => allowsManualAdjustments ? amount(value, name) : 0;
  const requestedExtras = {
    overtime: optionalAmount(query.overtime, "Overtime"), incentive: optionalAmount(query.incentive, "Incentive"),
    yearlyBonus: optionalAmount(query.yearlyBonus, "Yearly bonus"), medicalReimbursement: optionalAmount(query.medicalReimbursement, "Medical reimbursement"),
    arrears: optionalAmount(query.arrears, "Arrears"), loanGiven: optionalAmount(query.loanGiven, "Loan given"),
  };
  const requestedDeductions = {
    personalLoan: optionalAmount(query.personalLoan, "Personal loan"),
    advanceSalary: optionalAmount(query.advanceSalary, "Advance salary"), professionalTax: optionalAmount(query.professionalTax, "Professional tax"),
    eobi: optionalAmount(query.eobi, "EOBI deduction"), providentFund: optionalAmount(query.providentFund, "PF deduction"),
    other: optionalAmount(query.otherDeduction, "Other deduction"),
  };
  const zeroValues = (values) => Object.fromEntries(Object.keys(values).map((key) => [key, 0]));
  const extras = allowsManualAdjustments ? requestedExtras : zeroValues(requestedExtras);
  const manualDeductions = allowsManualAdjustments ? requestedDeductions : zeroValues(requestedDeductions);
  const additionalEarnings = Object.values(extras).reduce((total, value) => total + value, 0) + overtimePay;
  const manualDeductionTotal = Object.values(manualDeductions).reduce((total, value) => total + value, 0);
  const totalDeductions = unpaidLeaveDeduction.applied + lateDeduction + shortDeduction.applied + incomeTax.applied + manualDeductionTotal;
  const totalEarnings = salary + additionalEarnings;
  const daysOver30Late = days.filter((day) => day.lateMinutes > 30).length;

  return {
    company: { name: settings?.companyName || "BIZTEK PROFESSIONALS", timezone: settings?.timezone || "Asia/Karachi" },
    employee: { _id: employee._id, employeeId: employee.employeeId, name: employee.name, email: employee.email || "", designation: employee.designation, department: employee.department, status: employee.status, monthlySalary: salary, salaryCurrency: payStructure.currency },
    period: { startDate: start, endDate: end },
    attendance: { workingDays, presentDays, absentDays, leaveDays, holidayDays: yearlyHolidays.filter((holiday) => holiday.date >= start).length, expectedMinutes: expected, actualMinutes: actual, shortMinutes: short, lateMinutes: late, overtimeMinutes: overtime },
    payment: { mode: query.paymentMode || "Transfer", calendarDays: Math.floor((endDate - startDate) / DAY) + 1 },
    leaveSummary: { year: Number(leaveYear), ...leaveSummary },
    earnings: { directSalary: payStructure.directSalary, basicSalary: payStructure.basicSalary, accommodationAllowance: payStructure.accommodationAllowance, conveyanceAllowance: payStructure.conveyanceAllowance, medicalAllowance: payStructure.medicalAllowance, overtimePay: money(overtimePay + extras.overtime), incentive: money(extras.incentive), yearlyBonus: money(extras.yearlyBonus), medicalReimbursement: money(extras.medicalReimbursement), arrears: money(extras.arrears), loanGiven: money(extras.loanGiven), totalEarnings: money(totalEarnings) },
    deductions: { ...Object.fromEntries(Object.entries(manualDeductions).map(([key, value]) => [key, money(value)])), incomeTax: incomeTax.applied, incomeTaxCalculated: incomeTax.calculated, incomeTaxOverridden: incomeTax.overridden, absence: money(absenceDeduction), unpaidLeaveCalculated: unpaidLeaveDeduction.calculated, unpaidLeave: unpaidLeaveDeduction.applied, unpaidLeaveOverridden: unpaidLeaveDeduction.overridden, shortHoursCalculated: shortDeduction.calculated, shortHours: shortDeduction.applied, shortHoursOverridden: shortDeduction.overridden, lateArrival: money(lateDeduction), total: money(totalDeductions) },
    tax: calculatedTax ? { ...calculatedTax, appliedMonthlyTax: incomeTax.applied, overridden: incomeTax.overridden, basis: "Fixed gross monthly salary annualized over 12 months" } : null,
    others: allowsManualAdjustments ? { personalLoanBalance: amount(query.personalLoanBalance, "Personal loan balance"), motorVehicleLoanBalance: amount(query.motorVehicleLoanBalance, "Motor vehicle loan balance"), withholdingTax: amount(query.withholdingTax, "Withholding tax"), oldPfBalance: amount(query.oldPfBalance, "Old PF balance"), newPfBalance: amount(query.newPfBalance, "New PF balance"), employeePfShare: amount(query.employeePfShare, "Employee PF share"), employerPfShare: amount(query.employerPfShare, "Employer PF share"), pfWithdrawal: amount(query.pfWithdrawal, "PF withdrawal") } : { personalLoanBalance: 0, motorVehicleLoanBalance: 0, withholdingTax: 0, oldPfBalance: 0, newPfBalance: 0, employeePfShare: 0, employerPfShare: 0, pfWithdrawal: 0 },
    netSalary: money(Math.max(0, totalEarnings - totalDeductions)),
    attendanceAnalysis: { shortMinutes: short, daysOver30Late, absentDays, incompleteAttendanceDays: days.filter((day) => byDate.has(day.workDate) && day.actualMinutes === 0 && !day.leave).length, workFromHomeDays: 0 },
    policy: { currency: payStructure.currency, allowsAutomaticAdjustments, allowsManualAdjustments, dynamicWorkingDays: workingDays, salaryDivisor: workingDays, deductAbsences: false, deductExcessLeave: allowsAutomaticAdjustments, deductShortHours: allowsAutomaticAdjustments && payroll.deductShortHours !== false, deductLateHours: allowsAutomaticAdjustments && Boolean(lateEnabled), payOvertime: allowsAutomaticAdjustments && Boolean(payroll.payOvertime && employee.payrollSettings?.overtimeEligible) },
  };
}

r.get("/mail/status", (req, res) => res.json(publicMailStatus()));

r.post("/mail/test", asyncHandler(async (req, res) => {
  await createPayslipMailer().verify();
  res.json({ message: "Gmail SMTP connection is working" });
}));

r.post("/:id/email", asyncHandler(async (req, res) => {
  const payslip = await calculatePayslip(req.params.id, req.body || {});
  if (!payslip.employee.email) throw new AppError(422, "This employee has no stored email address. Add it in Employees first.");
  try {
    const pdf = await renderPayslipPdf(payslip);
    const result = await createPayslipMailer().send({
      recipient: payslip.employee.email,
      employeeName: payslip.employee.name,
      period: payslip.period,
      pdf,
    });
    await PayslipEmailLog.create({
      employee: payslip.employee._id, employeeId: payslip.employee.employeeId,
      recipient: payslip.employee.email, periodStart: payslip.period.startDate,
      periodEnd: payslip.period.endDate, status: "sent", messageId: result.messageId,
      sentBy: req.user._id,
    });
    res.json({ message: `Payslip emailed to ${payslip.employee.email}` });
  } catch (error) {
    await PayslipEmailLog.create({
      employee: payslip.employee._id, employeeId: payslip.employee.employeeId,
      recipient: payslip.employee.email, periodStart: payslip.period.startDate,
      periodEnd: payslip.period.endDate, status: "failed",
      error: String(error.message || "Email delivery failed").slice(0, 500), sentBy: req.user._id,
    });
    throw new AppError(502, "Payslip email could not be sent. Check Gmail SMTP settings and the app password.");
  }
}));

r.post("/:id/publish", asyncHandler(async (req, res) => {
  const payslip = await calculatePayslip(req.params.id, req.body || {});
  if (!payslip.employee.email) throw new AppError(422, "Add the employee email before publishing");
  const published = await PublishedPayslip.create({ ...createPublishedSnapshot(payslip), publishedBy: req.user._id });
  try {
    const pdf = await renderPayslipPdf(published.data);
    const result = await createPayslipMailer().send({ recipient: payslip.employee.email, employeeName: payslip.employee.name, period: payslip.period, pdf });
    published.delivery = { status: "sent", attempts: 1, messageId: result.messageId, lastAttemptAt: new Date() };
  } catch (error) {
    published.delivery = { status: "failed", attempts: 1, lastError: String(error.message).slice(0, 500), lastAttemptAt: new Date() };
  }
  await published.save();
  res.status(201).json({ message: published.delivery.status === "sent" ? "Payslip published and emailed" : "Payslip published; email delivery failed and can be retried", payslip: published });
}));
r.post("/published/:id/retry-email", asyncHandler(async (req, res) => {
  const published = await PublishedPayslip.findOne({ _id: req.params.id, status: "published" });
  if (!published) throw new AppError(404, "Published payslip not found");
  const pdf = await renderPayslipPdf(published.data);
  const result = await createPayslipMailer().send({ recipient: published.data.employee.email, employeeName: published.data.employee.name, period: published.data.period, pdf });
  published.delivery = { status: "sent", attempts: (published.delivery?.attempts || 0) + 1, messageId: result.messageId, lastAttemptAt: new Date() }; await published.save();
  res.json({ message: "Payslip email sent" });
}));
r.post("/published/:id/void", asyncHandler(async (req, res) => {
  const reason = String(req.body.reason || "").trim(); if (!reason) throw new AppError(422, "Reason is required");
  const published = await PublishedPayslip.findOneAndUpdate({ _id: req.params.id, status: "published" }, { status: "void", voidReason: reason, voidedAt: new Date(), voidedBy: req.user._id }, { new: true });
  if (!published) throw new AppError(404, "Published payslip not found"); res.json({ message: "Payslip voided. Generate and publish its replacement." });
}));

r.get("/:id", asyncHandler(async (req, res) => {
  res.json(await calculatePayslip(req.params.id, req.query));
}));

export default r;
