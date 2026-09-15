const DAY = 86400000;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const dateKey = (date) => date.toISOString().slice(0, 10);

function validDate(value) {
  if (!datePattern.test(value || "")) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.valueOf()) && dateKey(date) === value;
}

function invalid(message) {
  const error = new Error(message);
  error.status = 422;
  throw error;
}

export function validateLeaveRequest({ requestedType, startDate, endDate, reason, today = dateKey(new Date()) }) {
  if (!["sick", "casual", "other"].includes(requestedType)) invalid("Choose Sick, Casual, or Other leave");
  if (!validDate(startDate) || !validDate(endDate) || startDate > endDate) invalid("Choose a valid leave date range");
  if (startDate < today) invalid("Leave requests cannot start in the past");
  const span = (new Date(`${endDate}T12:00:00Z`) - new Date(`${startDate}T12:00:00Z`)) / DAY + 1;
  if (span > 90) invalid("Leave requests cannot exceed 90 calendar days");
  const cleanReason = String(reason || "").trim();
  if (!cleanReason || cleanReason.length > 1000) invalid("Reason is required and cannot exceed 1,000 characters");
  return { requestedType, startDate, endDate, reason: cleanReason };
}

export function leaveRequestOverlapFilter(employee, startDate, endDate) {
  return { employee, status: { $in: ["pending", "approved"] }, startDate: { $lte: endDate }, endDate: { $gte: startDate } };
}

export function workingLeaveDates(startDate, endDate, holidayDates = new Set()) {
  const dates = [];
  for (let date = new Date(`${startDate}T12:00:00Z`); date <= new Date(`${endDate}T12:00:00Z`); date = new Date(date.getTime() + DAY)) {
    const key = dateKey(date), day = date.getUTCDay();
    if (day !== 0 && day !== 6 && !holidayDates.has(key)) dates.push(key);
  }
  return dates;
}
