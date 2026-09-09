import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateAttendance,
  localDateTime,
  workDateForPunch,
} from "../src/services/attendanceProcessor.js";
const employee = { _id: "employee", employeeId: "1001" };
const shift = {
  _id: "shift",
  startTime: "14:30",
  endTime: "23:00",
  expectedMinutes: 510,
  gracePeriodMinutes: 10,
  crossesMidnight: false,
  processingWindowBeforeMinutes: 240,
  processingWindowAfterMinutes: 240,
};
const p = (date, time, id = "p") => ({
  _id: id,
  punchDateTime: localDateTime(date, time),
});
const calc = (punches, s = shift, date = "2026-09-03") =>
  calculateAttendance({ employee, shift: s, workDate: date, punches });
test("pairs standard shift", () => {
  const r = calc([p("2026-09-03", "2:35 PM"), p("2026-09-03", "11:02 PM")]);
  assert.equal(r.actualClockIn.getHours(), 14);
  assert.equal(r.actualClockOut.getMinutes(), 2);
});
test("uses earliest and latest from multiple scans", () => {
  const r = calc(
    ["2:31 PM", "2:32 PM", "2:35 PM", "11:01 PM", "11:03 PM"].map((t, i) =>
      p("2026-09-03", t, String(i)),
    ),
  );
  assert.equal(r.actualClockIn.getMinutes(), 31);
  assert.equal(r.actualClockOut.getMinutes(), 3);
  assert.equal(r.sourcePunchIds.length, 5);
});
test("assigns post-midnight punch to prior work date", () => {
  const s = {
    ...shift,
    startTime: "15:30",
    endTime: "00:30",
    expectedMinutes: 540,
    crossesMidnight: true,
  };
  const out = p("2026-09-04", "12:32 AM");
  assert.equal(workDateForPunch(out, s), "2026-09-03");
  const r = calc([p("2026-09-03", "3:35 PM"), out], s);
  assert.equal(r.workDate, "2026-09-03");
  assert.equal(r.actualMinutes, 537);
});
test("detects missing clock-out", () =>
  assert.deepEqual(calc([p("2026-09-03", "2:35 PM")]).conditions, [
    "Missing Clock-Out",
  ]));
test("detects missing clock-in", () =>
  assert.deepEqual(calc([p("2026-09-03", "11:03 PM")]).conditions, [
    "Missing Clock-In",
  ]));
test("applies grace period to late time", () =>
  assert.equal(
    calc([p("2026-09-03", "2:47 PM"), p("2026-09-03", "11:00 PM")]).lateMinutes,
    7,
  ));
test("does not count an arrival within grace as short time", () => {
  const result = calc([
    p("2026-09-03", "2:40 PM"),
    p("2026-09-03", "11:00 PM"),
  ]);
  assert.equal(result.lateMinutes, 0);
  assert.equal(result.shortMinutes, 0);
});
test("counts only arrival time beyond grace as short time", () => {
  const result = calc([
    p("2026-09-03", "2:47 PM"),
    p("2026-09-03", "11:00 PM"),
  ]);
  assert.equal(result.lateMinutes, 7);
  assert.equal(result.shortMinutes, 7);
});
test("calculates short time", () =>
  assert.equal(
    calc([p("2026-09-03", "2:30 PM"), p("2026-09-03", "10:30 PM")])
      .shortMinutes,
    30,
  ));
test("calculates overtime", () =>
  assert.equal(
    calc([p("2026-09-03", "2:30 PM"), p("2026-09-03", "11:30 PM")])
      .overtimeMinutes,
    30,
  ));
