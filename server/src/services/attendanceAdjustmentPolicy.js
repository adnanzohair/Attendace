import { AppError } from "../utils/http.js";

export const DEFAULT_TIME_CORRECTION_REASON = "Manual clock-in/clock-out correction";

export function attendanceAdjustmentReason(attendanceType, reason) {
  const value = String(reason || "").trim();
  if (attendanceType !== "present" && !value) {
    throw new AppError(422, "A reason is required when assigning leave");
  }
  return value || DEFAULT_TIME_CORRECTION_REASON;
}
