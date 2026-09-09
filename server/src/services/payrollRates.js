export function calculatePayrollRates(monthlySalary, workingDays, totalExpectedMinutes) {
  if (!workingDays) {
    return { dailyRate: 0, averageExpectedMinutes: 0, minuteRate: 0 };
  }

  const dailyRate = Number(monthlySalary) / workingDays;
  const averageExpectedMinutes = totalExpectedMinutes / workingDays;
  return {
    dailyRate,
    averageExpectedMinutes,
    minuteRate: averageExpectedMinutes ? dailyRate / averageExpectedMinutes : 0,
  };
}
