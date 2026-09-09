export function calculateLeaveEntitlement({
  sickGranted = 0,
  casualGranted = 0,
  periodStart,
  periodEnd,
  events = [],
}) {
  const grants = { sick: Number(sickGranted) || 0, casual: Number(casualGranted) || 0 };
  const totals = {
    sick: { usedYtd: 0, usedInPeriod: 0, excessInPeriod: 0 },
    casual: { usedYtd: 0, usedInPeriod: 0, excessInPeriod: 0 },
  };

  for (const event of [...events].sort((a, b) => a.workDate.localeCompare(b.workDate))) {
    const type = event.type === "sick" ? "sick" : "casual";
    const summary = totals[type];
    summary.usedYtd += 1;
    if (event.workDate >= periodStart && event.workDate <= periodEnd) {
      summary.usedInPeriod += 1;
      if (summary.usedYtd > grants[type]) summary.excessInPeriod += 1;
    }
  }

  const result = {};
  for (const type of ["sick", "casual"]) {
    const granted = grants[type], usedYtd = totals[type].usedYtd;
    result[type] = {
      granted,
      usedYtd,
      usedInPeriod: totals[type].usedInPeriod,
      remaining: Math.max(0, granted - usedYtd),
      excessYtd: Math.max(0, usedYtd - granted),
      excessInPeriod: totals[type].excessInPeriod,
    };
  }
  return {
    ...result,
    unpaidDaysInPeriod: result.sick.excessInPeriod + result.casual.excessInPeriod,
  };
}
