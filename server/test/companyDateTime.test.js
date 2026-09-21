import test from "node:test";
import assert from "node:assert/strict";
import { addCalendarDays, dateTimeInZone, dateTimeLocalInZone, zonedDateParts } from "../src/services/companyDateTime.js";

test("parses machine wall time as Asia/Karachi regardless of server timezone", () => {
  const value = dateTimeInZone("2026-09-18", "2:35 PM", "Asia/Karachi");
  assert.equal(value.toISOString(), "2026-09-18T09:35:00.000Z");
  assert.deepEqual(zonedDateParts(value, "Asia/Karachi"), {
    date: "2026-09-18",
    hours: 14,
    minutes: 35,
  });
});

test("adds calendar days without depending on the host timezone", () => {
  assert.equal(addCalendarDays("2026-09-30", 1), "2026-10-01");
});

test("parses manual datetime-local input in the company timezone", () => {
  assert.equal(dateTimeLocalInZone("2026-09-18T14:35").toISOString(), "2026-09-18T09:35:00.000Z");
  assert.equal(dateTimeLocalInZone(""), null);
});
