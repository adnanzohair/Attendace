import test from "node:test";
import assert from "node:assert/strict";
import { payslipContentDisposition } from "../src/services/payslipDisposition.js";

test("uses inline disposition for the employee portal preview", () => {
  assert.equal(
    payslipContentDisposition({ inline: true, startDate: "2026-07-25", endDate: "2026-08-25" }),
    'inline; filename="payslip_2026-07-25_2026-08-25.pdf"',
  );
});

test("uses attachment disposition for downloads", () => {
  assert.equal(
    payslipContentDisposition({ inline: false, startDate: "2026-07-25", endDate: "2026-08-25" }),
    'attachment; filename="payslip_2026-07-25_2026-08-25.pdf"',
  );
});
