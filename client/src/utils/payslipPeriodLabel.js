const parseDate = (value) => new Date(`${value}T12:00:00Z`);

export function payslipPeriodLabel(startDate, endDate) {
  const month = parseDate(endDate).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const rangeDate = (value) => parseDate(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${month} (${rangeDate(startDate)} – ${rangeDate(endDate)})`;
}
