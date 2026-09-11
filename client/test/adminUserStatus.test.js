import test from "node:test";
import assert from "node:assert/strict";
import { adminUserStatus } from "../src/utils/adminUserStatus.js";

test("describes owner, pending invitation, disabled, and active administrator states", () => {
  assert.equal(adminUserStatus({ role: "owner", active: true }), "Owner");
  assert.equal(adminUserStatus({ invitationPending: true, active: false }), "Invitation pending");
  assert.equal(adminUserStatus({ active: false }), "Disabled");
  assert.equal(adminUserStatus({ role: "admin", active: true }), "Active admin");
});
