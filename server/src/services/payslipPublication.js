export function createPublishedSnapshot(payslip) {
  const data = structuredClone(payslip);
  return { employee: payslip.employee._id, employeeId: payslip.employee.employeeId, periodStart: payslip.period.startDate, periodEnd: payslip.period.endDate, currency: payslip.employee.salaryCurrency, netSalary: payslip.netSalary, data, templateVersion: 1 };
}
export const employeePayslipFilter = (employee, payslipId) => ({ ...(payslipId ? { _id: payslipId } : {}), employee, status: "published" });
