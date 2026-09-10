import test from "node:test";
import assert from "node:assert/strict";
import { buildEmployeeAttendanceDays } from "../src/services/employeeAttendanceDays.js";

test("fills missing weekdays as absent and excludes holidays from required hours", () => {
  const days = buildEmployeeAttendanceDays({
    startDate: "2026-08-03",
    endDate: "2026-08-05",
    records: [{ _id: "a", workDate: "2026-08-03", actualMinutes: 510, expectedMinutes: 510, status: "Present", conditions: ["Present"] }],
    holidays: [{ date: "2026-08-04", name: "Company Holiday" }],
  });

  assert.deepEqual(days.map(({ date, requiredMinutes, shortMinutes, status }) => ({ date, requiredMinutes, shortMinutes, status })), [
    { date: "2026-08-03", requiredMinutes: 510, shortMinutes: 0, status: "Present" },
    { date: "2026-08-04", requiredMinutes: 0, shortMinutes: 0, status: "Holiday · Company Holiday" },
    { date: "2026-08-05", requiredMinutes: 510, shortMinutes: 510, status: "Absent" },
  ]);
});

test("does not mark future days absent", () => {
  const days = buildEmployeeAttendanceDays({
    startDate: "2026-09-07",
    endDate: "2026-09-11",
    records: [],
    holidays: [],
    asOfDate: "2026-09-09",
  });
  assert.deepEqual(days.map((day) => day.date), ["2026-09-07", "2026-09-08", "2026-09-09"]);
});
