const nonNegativeNumber = (value) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) && number >= 0 ? number : 0;
};

export function employeeLeaveBalance({ sickGranted, casualGranted, sickUsed, casualUsed }) {
  const normalized = {
    sickGranted: nonNegativeNumber(sickGranted),
    casualGranted: nonNegativeNumber(casualGranted),
    sickUsed: nonNegativeNumber(sickUsed),
    casualUsed: nonNegativeNumber(casualUsed),
  };
  return {
    ...normalized,
    sickRemaining: Math.max(0, normalized.sickGranted - normalized.sickUsed),
    casualRemaining: Math.max(0, normalized.casualGranted - normalized.casualUsed),
  };
}
