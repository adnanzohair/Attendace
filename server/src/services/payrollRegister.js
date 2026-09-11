const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const money = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

export function buildPayrollRegisterFilter({ startDate, endDate, status, search } = {}) {
  const filter = {};
  if (startDate) filter.periodStart = { $gte: startDate };
  if (endDate) filter.periodEnd = { $lte: endDate };
  if (["published", "void"].includes(status)) filter.status = status;
  if (String(search || "").trim()) {
    const $regex = new RegExp(escapeRegex(String(search).trim()), "i");
    filter.$or = [
      { "data.employee.name": { $regex } },
      { employeeId: { $regex } },
    ];
  }
  return filter;
}

export function summarizePayroll(payslips) {
  const active = payslips.filter((payslip) => payslip.status === "published");
  const currencies = {};
  for (const payslip of active) {
    const currency = payslip.currency || "PKR";
    const totals = currencies[currency] || { gross: 0, deductions: 0, net: 0 };
    totals.gross = money(totals.gross + Number(payslip.data?.earnings?.totalEarnings || 0));
    totals.deductions = money(totals.deductions + Number(payslip.data?.deductions?.total || 0));
    totals.net = money(totals.net + Number(payslip.netSalary || 0));
    currencies[currency] = totals;
  }
  return {
    employeeCount: new Set(active.map((payslip) => payslip.employeeId)).size,
    payslipCount: active.length,
    currencies,
  };
}
