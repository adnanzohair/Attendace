import test from "node:test";
import assert from "node:assert/strict";
import { attendanceAdjustmentReason } from "../src/services/attendanceAdjustmentPolicy.js";

test("uses an automatic audit reason when a time correction has no reason", () => {
  assert.equal(attendanceAdjustmentReason("present", ""), "Manual clock-in/clock-out correction");
  assert.equal(attendanceAdjustmentReason("present", undefined), "Manual clock-in/clock-out correction");
});

test("preserves a supplied time-correction reason", () => {
  assert.equal(attendanceAdjustmentReason("present", "  Forgot to clock out  "), "Forgot to clock out");
});

test("still requires a reason when assigning leave", () => {
  assert.throws(() => attendanceAdjustmentReason("sick", ""), /reason is required/i);
  assert.equal(attendanceAdjustmentReason("casual", "Family event"), "Family event");
});
