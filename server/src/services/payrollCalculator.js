const money = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

function applyOverride(calculatedValue, overrideValue, label) {
  const calculated = money(calculatedValue);
  if (overrideValue === undefined || overrideValue === null || overrideValue === "") return { calculated, applied: calculated, overridden: false };
  const override = Number(overrideValue);
  if (!Number.isFinite(override) || override < 0) throw new RangeError(`${label} override must be zero or a positive number`);
  return { calculated, applied: money(override), overridden: true };
}

export const applyShortHoursOverride = (calculatedValue, overrideValue) => applyOverride(calculatedValue, overrideValue, "Short-hours deduction");
export const applyIncomeTaxOverride = (calculatedValue, overrideValue) => applyOverride(calculatedValue, overrideValue, "Income-tax deduction");
export const applyUnpaidLeaveOverride = (calculatedValue, overrideValue) => applyOverride(calculatedValue, overrideValue, "Unpaid-leave deduction");
