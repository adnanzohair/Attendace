import test from "node:test";
import assert from "node:assert/strict";
import { employeeCookieOptions, validPassword, tokenIsUsable } from "../src/services/employeeAuthPolicy.js";

test("employee password policy requires ten characters", () => {
  assert.equal(validPassword("short"), false);
  assert.equal(validPassword("long-enough-password"), true);
});

test("account token must match, remain unused, and be unexpired", () => {
  const now = new Date("2026-09-09T12:00:00Z");
  assert.equal(tokenIsUsable({ expectedHash: "a", actualHash: "a", expiresAt: new Date("2026-09-09T13:00:00Z"), now }), true);
  assert.equal(tokenIsUsable({ expectedHash: "a", actualHash: "a", expiresAt: new Date("2026-09-09T11:00:00Z"), now }), false);
  assert.equal(tokenIsUsable({ expectedHash: null, actualHash: "a", expiresAt: new Date("2026-09-09T13:00:00Z"), now }), false);
});

test("production employee cookie is cross-site secure", () => {
  assert.deepEqual(employeeCookieOptions("production"), { httpOnly: true, sameSite: "none", secure: true, maxAge: 28800000 });
});
