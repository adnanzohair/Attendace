import test from "node:test";
import assert from "node:assert/strict";
import { createAccountToken, hashAccountToken } from "../src/services/accountTokens.js";
import { safeEmployee } from "../src/services/employeeSafeView.js";

test("account tokens are random and only their hash needs persistence", () => {
  const first = createAccountToken(), second = createAccountToken();
  assert.notEqual(first.rawToken, second.rawToken);
  assert.equal(first.tokenHash, hashAccountToken(first.rawToken));
  assert.match(first.tokenHash, /^[a-f0-9]{64}$/);
});

test("employee-safe view excludes salary and administrative settings", () => {
  const view = safeEmployee({ _id: "db-id", employeeId: "101", name: "A", email: "a@example.com", department: "Dev", designation: "Engineer", joiningDate: "2026-01-01", phone: "1", monthlySalary: 90000, payrollSettings: { overtimeEligible: true }, shiftId: "secret" });
  assert.deepEqual(Object.keys(view).sort(), ["department", "designation", "email", "employeeId", "joiningDate", "name", "phone"].sort());
});
