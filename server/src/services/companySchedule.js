export function scheduleForDay(day, grace = {}) {
  const friday = day === 5;
  const configuredGrace = friday ? grace.fridayMinutes : grace.mondayThursdayMinutes;
  return {
    name: friday ? "Company Schedule · Friday" : "Company Schedule · Monday–Thursday",
    startTime: friday ? "15:30" : "14:30",
    endTime: friday ? "23:30" : "23:00",
    expectedMinutes: friday ? 480 : 510,
    gracePeriodMinutes: Math.max(0, Number(configuredGrace) || 0),
  };
}
