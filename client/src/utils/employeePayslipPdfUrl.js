export function employeePayslipPdfUrl(id, inline = false) {
  const base = `/api/employee-portal/payslips/${encodeURIComponent(id)}/download`;
  return inline ? `${base}?inline=1` : base;
}
