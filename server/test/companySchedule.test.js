import test from "node:test";
import assert from "node:assert/strict";

async function scheduleService() {
  try {
    return await import("../src/services/companySchedule.js");
  } catch (error) {
    assert.fail(`Company schedule service is unavailable: ${error.message}`);
  }
}

test("uses the Monday-through-Thursday grace setting", async () => {
  const { scheduleForDay } = await scheduleService();
  assert.deepEqual(scheduleForDay(1, { mondayThursdayMinutes: 15, fridayMinutes: 20 }), {
    name: "Company Schedule · Monday–Thursday",
    startTime: "14:30",
    endTime: "23:00",
    expectedMinutes: 510,
    gracePeriodMinutes: 15,
  });
});

test("uses the separate Friday grace setting", async () => {
  const { scheduleForDay } = await scheduleService();
  assert.deepEqual(scheduleForDay(5, { mondayThursdayMinutes: 15, fridayMinutes: 20 }), {
    name: "Company Schedule · Friday",
    startTime: "15:30",
    endTime: "23:30",
    expectedMinutes: 480,
    gracePeriodMinutes: 20,
  });
});
