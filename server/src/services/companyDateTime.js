export const DEFAULT_COMPANY_TIME_ZONE = "Asia/Karachi";

export function parseTime(value) {
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3]?.toUpperCase();
  if (minutes > 59 || hours < 0 || hours > (period ? 12 : 23) || (period && hours === 0)) return null;
  if (period) {
    if (hours === 12) hours = 0;
    if (period === "PM") hours += 12;
  }
  return hours * 60 + minutes;
}

const formatterFor = (timeZone) => new Intl.DateTimeFormat("en-CA", {
  timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function zonedDateParts(value, timeZone = DEFAULT_COMPANY_TIME_ZONE) {
  const parts = Object.fromEntries(formatterFor(timeZone).formatToParts(value).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hours: Number(parts.hour),
    minutes: Number(parts.minute),
  };
}

export function dateTimeInZone(date, time, timeZone = DEFAULT_COMPANY_TIME_ZONE) {
  const totalMinutes = parseTime(time);
  if (totalMinutes === null || !/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return null;
  const [year, month, day] = date.split("-").map(Number);
  const hours = Math.floor(totalMinutes / 60), minutes = totalMinutes % 60;
  const desiredAsUtc = Date.UTC(year, month - 1, day, hours, minutes);
  let instant = new Date(desiredAsUtc);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const observed = zonedDateParts(instant, timeZone);
    const observedAsUtc = Date.UTC(...observed.date.split("-").map(Number).map((number, index) => index === 1 ? number - 1 : number), observed.hours, observed.minutes);
    instant = new Date(instant.getTime() + desiredAsUtc - observedAsUtc);
  }
  const verified = zonedDateParts(instant, timeZone);
  return verified.date === date && verified.hours === hours && verified.minutes === minutes ? instant : null;
}

export function dateTimeLocalInZone(value, timeZone = DEFAULT_COMPANY_TIME_ZONE) {
  const match = String(value || "").match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?$/);
  return match ? dateTimeInZone(match[1], match[2], timeZone) : null;
}

export function addCalendarDays(date, days) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days));
  return value.toISOString().slice(0, 10);
}
