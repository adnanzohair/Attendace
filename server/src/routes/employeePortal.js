import { Router } from "express";
import { Attendance, Holiday, PublishedPayslip } from "../models/index.js";
import { employeeAuth } from "../middleware/employeeAuth.js";
import { safeEmployee } from "../services/employeeSafeView.js";
import { employeePayslipFilter } from "../services/payslipPublication.js";
import { renderPayslipPdf } from "../services/payslipPdf.js";
import { currentPayrollMonth, payrollPeriodForMonth } from "../services/payrollPeriod.js";
import { AppError, asyncHandler } from "../utils/http.js";
import { buildEmployeeAttendanceDays } from "../services/employeeAttendanceDays.js";

const r = Router();
r.use(employeeAuth);
const dateKey = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
export const employeeAttendanceFilter = (employee, startDate, endDate) => ({ employeeId: employee.employeeId, workDate: { $gte: startDate, $lte: endDate } });
function range(query) {
  if (query.month) return payrollPeriodForMonth(query.month);
  const startDate = query.startDate, endDate = query.endDate;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate || "") || !/^\d{4}-\d{2}-\d{2}$/.test(endDate || "") || startDate > endDate) throw new AppError(422, "Choose a valid date range");
  const span = (new Date(`${endDate}T12:00:00`) - new Date(`${startDate}T12:00:00`)) / 86400000;
  if (span > 730) throw new AppError(422, "Date range cannot exceed two years");
  return { label: "Custom range", startDate, endDate };
}
const minutes = (records, field) => records.reduce((sum, record) => sum + Number(record[field] || 0), 0);
r.get("/profile", (req, res) => res.json({ employee: safeEmployee(req.employee) }));
r.get("/attendance", asyncHandler(async (req, res) => {
  const period = range(req.query);
  const [records, holidays] = await Promise.all([
    Attendance.find(employeeAttendanceFilter(req.employee, period.startDate, period.endDate)).sort("workDate").lean(),
    Holiday.find({ date: { $gte: period.startDate, $lte: period.endDate }, active: true }).lean(),
  ]);
  const joiningDate = req.employee.joiningDate ? req.employee.joiningDate.toISOString().slice(0, 10) : null;
  res.json({ period, records: buildEmployeeAttendanceDays({ startDate: period.startDate, endDate: period.endDate, records, holidays, joiningDate, asOfDate: dateKey(new Date()) }) });
}));
r.get("/dashboard", asyncHandler(async (req, res) => {
  const period = payrollPeriodForMonth(req.query.month || currentPayrollMonth());
  const leaveYear = period.endDate.slice(0, 4);
  const [records, yearlyRecords, holidays, latestPayslip] = await Promise.all([
    Attendance.find(employeeAttendanceFilter(req.employee, period.startDate, period.endDate)).lean(),
    Attendance.find(employeeAttendanceFilter(req.employee, `${leaveYear}-01-01`, `${leaveYear}-12-31`)).select("status conditions leaveType").lean(),
    Holiday.find({ date: { $gte: period.startDate, $lte: period.endDate }, active: true }).lean(),
    PublishedPayslip.findOne(employeePayslipFilter(req.employee._id)).sort({ periodEnd: -1 }).select("periodStart periodEnd currency netSalary publishedAt").lean(),
  ]);
  const has = (record, value) => record.status === value || record.conditions?.includes(value);
  const joiningDate = req.employee.joiningDate ? req.employee.joiningDate.toISOString().slice(0, 10) : null;
  const attendanceDays = buildEmployeeAttendanceDays({ startDate: period.startDate, endDate: period.endDate, records, holidays, joiningDate, asOfDate: dateKey(new Date()) });
  const sickUsed = yearlyRecords.filter((x) => x.leaveType === "sick" || has(x, "Sick Leave")).length;
  const casualUsed = yearlyRecords.filter((x) => x.leaveType === "casual" || has(x, "Casual Leave") || has(x, "Absent")).length;
  res.json({ employee: safeEmployee(req.employee), period, latestPayslip, summary: { presentDays: attendanceDays.filter((x) => x.totalMinutes > 0).length, absentDays: attendanceDays.filter((x) => x.conditions.includes("Absent")).length, lateDays: attendanceDays.filter((x) => x.lateMinutes > 0).length, shortMinutes: minutes(attendanceDays, "shortMinutes"), overtimeMinutes: minutes(attendanceDays, "overtimeMinutes"), sickUsed, casualUsed, sickRemaining: Math.max(0, Number(req.employee.leavePolicy?.sickGranted || 0) - sickUsed), casualRemaining: Math.max(0, Number(req.employee.leavePolicy?.casualGranted || 0) - casualUsed) } });
}));
r.get("/payslips", asyncHandler(async (req, res) => {
  const payslips = await PublishedPayslip.find(employeePayslipFilter(req.employee._id)).sort({ periodEnd: -1 }).select("periodStart periodEnd currency netSalary publishedAt delivery.status data.company data.employee").lean();
  res.json({ payslips });
}));
r.get("/payslips/:id", asyncHandler(async (req, res) => {
  const payslip = await PublishedPayslip.findOne(employeePayslipFilter(req.employee._id, req.params.id)).lean(); if (!payslip) throw new AppError(404, "Payslip not found"); res.json({ payslip });
}));
r.get("/payslips/:id/download", asyncHandler(async (req, res) => {
  const payslip = await PublishedPayslip.findOne(employeePayslipFilter(req.employee._id, req.params.id)).lean(); if (!payslip) throw new AppError(404, "Payslip not found");
  const pdf = await renderPayslipPdf(payslip.data); res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="payslip_${payslip.periodStart}_${payslip.periodEnd}.pdf"` }).send(pdf);
}));
export default r;
