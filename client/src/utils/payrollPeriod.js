const monthKey = (year, monthIndex) =>
  `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

export function payrollPeriodForMonth(value) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(value || ""));
  if (!match) throw new Error("Payroll month must use YYYY-MM format");

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) {
    throw new Error("Payroll month is invalid");
  }

  const previous = new Date(year, monthIndex - 1, 25, 12);
  return {
    startDate: `${monthKey(previous.getFullYear(), previous.getMonth())}-25`,
    endDate: `${monthKey(year, monthIndex)}-25`,
  };
}

export function currentPayrollMonth(date = new Date()) {
  const monthIndex = date.getDate() > 25 ? date.getMonth() + 1 : date.getMonth();
  const target = new Date(date.getFullYear(), monthIndex, 1, 12);
  return monthKey(target.getFullYear(), target.getMonth());
}
