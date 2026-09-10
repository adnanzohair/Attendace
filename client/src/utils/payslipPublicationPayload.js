export function payslipPublicationPayload({ startDate, endDate, adjustments, overrides }) {
  return { startDate, endDate, ...adjustments, ...overrides };
}
