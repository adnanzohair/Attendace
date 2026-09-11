import { payrollPeriodForMonth } from "./payrollPeriod.js";

export function payrollRegisterParams({ mode, month, startDate, endDate, search, status }) {
  const period = mode === "month" ? payrollPeriodForMonth(month) : { startDate, endDate };
  const params = { ...period };
  if (String(search || "").trim()) params.search = String(search).trim();
  if (status && status !== "all") params.status = status;
  return params;
}
