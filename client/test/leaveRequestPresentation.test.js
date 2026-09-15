import test from "node:test";
import assert from "node:assert/strict";
import { leaveStatusLabel, leaveTypeLabel } from "../src/utils/leaveRequestPresentation.js";

test("presents employee and approved leave types clearly", () => {
  assert.equal(leaveTypeLabel("sick"), "Sick Leave");
  assert.equal(leaveTypeLabel("casual"), "Casual Leave");
  assert.equal(leaveTypeLabel("other"), "Other Leave");
  assert.equal(leaveTypeLabel("unpaid"), "Unpaid Leave");
});

test("presents normalized approval statuses", () => {
  assert.equal(leaveStatusLabel("pending"), "Pending");
  assert.equal(leaveStatusLabel("approved"), "Approved");
  assert.equal(leaveStatusLabel("rejected"), "Rejected");
});
