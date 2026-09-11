export function payslipContentDisposition({ inline, startDate, endDate }) {
  const filename = `payslip_${startDate}_${endDate}.pdf`;
  return `${inline ? "inline" : "attachment"}; filename="${filename}"`;
}
