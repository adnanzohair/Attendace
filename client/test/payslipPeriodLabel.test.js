import test from "node:test";
import assert from "node:assert/strict";
import { payslipPeriodLabel } from "../src/utils/payslipPeriodLabel.js";

test("shows payroll month followed by its exact date range", () => {
  assert.equal(
    payslipPeriodLabel("2026-07-25", "2026-08-25"),
    "August 2026 (25 Jul 2026 – 25 Aug 2026)",
  );
});
