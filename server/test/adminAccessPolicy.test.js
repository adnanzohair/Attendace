import test from "node:test";
import assert from "node:assert/strict";
import { effectiveAdminRole, canManageAdmins, safeAdminUser } from "../src/services/adminAccessPolicy.js";

test("configured primary admin is treated as Owner during migration", () => {
  const user = { role: "admin", email: "adnan@tekglide.com" };
  assert.equal(effectiveAdminRole(user, "ADNAN@TEKGLIDE.COM"), "owner");
  assert.equal(canManageAdmins(user, "adnan@tekglide.com"), true);
});

test("ordinary admins cannot manage administrator accounts", () => {
  assert.equal(canManageAdmins({ role: "admin", email: "hr@example.com" }, "owner@example.com"), false);
});

test("safe admin view never exposes password or token hashes", () => {
  const safe = safeAdminUser({
    _id: "1", name: "HR", email: "hr@example.com", role: "admin", active: true,
    passwordHash: "secret", inviteTokenHash: "secret-token", lastLoginAt: null,
  });
  assert.deepEqual(safe, { id: "1", name: "HR", email: "hr@example.com", role: "admin", active: true, invitationPending: false, inviteExpiresAt: undefined, lastLoginAt: null, createdAt: undefined });
  assert.equal("passwordHash" in safe, false);
  assert.equal("inviteTokenHash" in safe, false);
});
