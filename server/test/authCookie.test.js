import test from "node:test";
import assert from "node:assert/strict";
import { authCookieOptions } from "../src/routes/auth.js";

test("production auth cookie supports cross-site HTTPS frontend", () => {
  assert.deepEqual(authCookieOptions("production"), {
    httpOnly: true, sameSite: "none", secure: true, maxAge: 28800000,
  });
});

test("logout uses matching cookie security attributes", () => {
  const { maxAge, ...expected } = authCookieOptions("production");
  assert.deepEqual(expected, { httpOnly: true, sameSite: "none", secure: true });
});
