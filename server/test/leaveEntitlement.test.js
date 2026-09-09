import test from "node:test";
import assert from "node:assert/strict";
import { Employee } from "../src/models/index.js";

test("employee schema persists yearly sick and casual leave grants", () => {
  assert.ok(Employee.schema.path("leavePolicy.sickGranted"));
  assert.ok(Employee.schema.path("leavePolicy.casualGranted"));
});

test("absence consumes casual leave and only excess days in the payslip period are unpaid", async () => {
  const { calculateLeaveEntitlement } = await import("../src/services/leaveEntitlement.js");
  const result = calculateLeaveEntitlement({
    sickGranted: 1,
    casualGranted: 2,
    periodStart: "2026-08-01",
    periodEnd: "2026-08-31",
    events: [
      { workDate: "2026-01-05", type: "sick" },
      { workDate: "2026-02-05", type: "sick" },
      { workDate: "2026-07-28", type: "casual" },
      { workDate: "2026-08-05", type: "absent" },
      { workDate: "2026-08-10", type: "casual" },
      { workDate: "2026-08-12", type: "absent" },
    ],
  });

  assert.deepEqual(result, {
    sick: { granted: 1, usedYtd: 2, usedInPeriod: 0, remaining: 0, excessYtd: 1, excessInPeriod: 0 },
    casual: { granted: 2, usedYtd: 4, usedInPeriod: 3, remaining: 0, excessYtd: 2, excessInPeriod: 2 },
    unpaidDaysInPeriod: 2,
  });
});
