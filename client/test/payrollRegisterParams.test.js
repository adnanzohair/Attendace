import test from "node:test";
import assert from "node:assert/strict";
import { payrollRegisterParams } from "../src/utils/payrollRegisterParams.js";

test("converts an August payroll month into the company date range", () => {
  assert.deepEqual(payrollRegisterParams({ mode: "month", month: "2026-08", search: " Adnan ", status: "published" }), {
    startDate: "2026-07-25",
    endDate: "2026-08-25",
    search: "Adnan",
    status: "published",
  });
});

test("preserves custom payroll dates", () => {
  assert.deepEqual(payrollRegisterParams({ mode: "custom", startDate: "2026-07-01", endDate: "2026-07-31", search: "", status: "all" }), {
    startDate: "2026-07-01",
    endDate: "2026-07-31",
  });
});
