import test from "node:test";
import assert from "node:assert/strict";
import { employeeLeaveBalance } from "../src/services/employeeLeaveBalance.js";

test("returns stored grants, usage and remaining balances together", () => {
  assert.deepEqual(employeeLeaveBalance({ sickGranted: 6, casualGranted: 12, sickUsed: 2, casualUsed: 3 }), {
    sickGranted: 6,
    casualGranted: 12,
    sickUsed: 2,
    casualUsed: 3,
    sickRemaining: 4,
    casualRemaining: 9,
  });
});

test("normalizes missing grants to zero and never returns negative remaining leave", () => {
  assert.deepEqual(employeeLeaveBalance({ sickUsed: 1, casualUsed: 2 }), {
    sickGranted: 0,
    casualGranted: 0,
    sickUsed: 1,
    casualUsed: 2,
    sickRemaining: 0,
    casualRemaining: 0,
  });
});
