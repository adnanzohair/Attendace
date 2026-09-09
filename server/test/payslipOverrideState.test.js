import test from "node:test";
import assert from "node:assert/strict";

async function control() {
  try { return (await import("../../client/src/utils/payslipOverride.js")).shortHoursControl; }
  catch (error) { assert.fail(`Payslip override state is unavailable: ${error.message}`); }
}

test("inherits the exact calculated value until the user edits it", async () => {
  const state = (await control())(1500.46, "", false);
  assert.deepEqual(state, { inputValue: "1500.46", queryValue: "", mode: "inherited" });
});

test("sends the edited value only after the user manually changes it", async () => {
  const state = (await control())(1500.46, "1200", true);
  assert.deepEqual(state, { inputValue: "1200", queryValue: "1200", mode: "manual" });
});

test("returning to inherited mode follows a recalculated amount", async () => {
  const state = (await control())(987.25, "1200", false);
  assert.deepEqual(state, { inputValue: "987.25", queryValue: "", mode: "inherited" });
});
