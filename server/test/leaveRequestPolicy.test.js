import test from "node:test";
import assert from "node:assert/strict";
import {
  leaveRequestOverlapFilter,
  validateLeaveRequest,
  workingLeaveDates,
} from "../src/services/leaveRequestPolicy.js";

test("validates and trims an employee leave request", () => {
  assert.deepEqual(validateLeaveRequest({
    requestedType: "casual",
    startDate: "2026-09-14",
    endDate: "2026-09-16",
    reason: "  Family commitment  ",
    today: "2026-09-12",
  }), { requestedType: "casual", startDate: "2026-09-14", endDate: "2026-09-16", reason: "Family commitment" });
  assert.throws(() => validateLeaveRequest({ requestedType: "casual", startDate: "2026-09-11", endDate: "2026-09-12", reason: "Past", today: "2026-09-12" }), /past/i);
});

test("overlap filter is scoped to the authenticated employee", () => {
  assert.deepEqual(leaveRequestOverlapFilter("employee-a", "2026-09-14", "2026-09-16"), {
    employee: "employee-a",
    status: { $in: ["pending", "approved"] },
    startDate: { $lte: "2026-09-16" },
    endDate: { $gte: "2026-09-14" },
  });
});

test("approved leave dates skip weekends and company holidays", () => {
  assert.deepEqual(
    workingLeaveDates("2026-09-11", "2026-09-15", new Set(["2026-09-14"])),
    ["2026-09-11", "2026-09-15"],
  );
});
