const key = (year, month, day) => `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
export function payrollPeriodForMonth(monthValue) {
  if (!/^\d{4}-\d{2}$/.test(monthValue)) throw new Error("Choose a valid payroll month");
  const [year, month] = monthValue.split("-").map(Number);
  if (month < 1 || month > 12) throw new Error("Choose a valid payroll month");
  const previous = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  return { label: new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }), startDate: key(previous.year, previous.month, 25), endDate: key(year, month, 25) };
}
export function currentPayrollMonth(now = new Date()) {
  let year = now.getFullYear(), month = now.getMonth() + 1;
  if (now.getDate() > 25) { month += 1; if (month === 13) { month = 1; year += 1; } }
  return `${year}-${String(month).padStart(2, "0")}`;
}
