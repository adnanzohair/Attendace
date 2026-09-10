const DAY = 86400000;
const dateKey = (date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, "0"),
  String(date.getDate()).padStart(2, "0"),
].join("-");
const expectedMinutes = (day) => day === 5 ? 480 : 510;

function attendanceDay(record) {
  return {
    id: record._id,
    date: record.workDate,
    checkIn: record.actualClockIn,
    checkOut: record.actualClockOut,
    totalMinutes: record.actualMinutes || 0,
    requiredMinutes: record.expectedMinutes || 0,
    shortMinutes: record.shortMinutes || 0,
    overtimeMinutes: record.overtimeMinutes || 0,
    lateMinutes: record.lateMinutes || 0,
    earlyDepartureMinutes: record.earlyLeaveMinutes || 0,
    status: record.conditions?.join(" + ") || record.status || "Present",
    conditions: record.conditions || [],
  };
}

export function buildEmployeeAttendanceDays({ startDate, endDate, records, holidays, joiningDate, asOfDate }) {
  const byDate = new Map(records.map((record) => [record.workDate, record]));
  const holidayByDate = new Map(holidays.map((holiday) => [holiday.date, holiday]));
  const days = [];

  for (let date = new Date(`${startDate}T12:00:00`); date <= new Date(`${endDate}T12:00:00`); date = new Date(date.getTime() + DAY)) {
    const day = date.getDay();
    const workDate = dateKey(date);
    if (asOfDate && workDate > asOfDate) break;
    if (day === 0 || day === 6 || (joiningDate && workDate < joiningDate)) continue;

    const holiday = holidayByDate.get(workDate);
    if (holiday) {
      days.push({ id: `holiday-${workDate}`, date: workDate, checkIn: null, checkOut: null, totalMinutes: 0, requiredMinutes: 0, shortMinutes: 0, overtimeMinutes: 0, lateMinutes: 0, earlyDepartureMinutes: 0, status: `Holiday · ${holiday.name}`, conditions: ["Holiday"] });
      continue;
    }

    const record = byDate.get(workDate);
    if (record) days.push(attendanceDay(record));
    else {
      const requiredMinutes = expectedMinutes(day);
      days.push({ id: `absent-${workDate}`, date: workDate, checkIn: null, checkOut: null, totalMinutes: 0, requiredMinutes, shortMinutes: requiredMinutes, overtimeMinutes: 0, lateMinutes: 0, earlyDepartureMinutes: 0, status: "Absent", conditions: ["Absent"] });
    }
  }

  return days;
}
