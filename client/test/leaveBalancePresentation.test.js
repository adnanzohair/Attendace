import test from "node:test";
import assert from "node:assert/strict";
import { grantedLeaveValue } from "../src/utils/leaveBalancePresentation.js";

test("shows the stored leave grant without inventing a default", () => {
  assert.equal(grantedLeaveValue(0), 0);
  assert.equal(grantedLeaveValue(6), 6);
  assert.equal(grantedLeaveValue(undefined), 0);
});
