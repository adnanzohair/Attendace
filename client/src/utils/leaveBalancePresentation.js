export const grantedLeaveValue = (value) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) && number >= 0 ? number : 0;
};
