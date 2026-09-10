import test from "node:test";
import assert from "node:assert/strict";
import { payslipPublicationPayload } from "../src/utils/payslipPublicationPayload.js";

test("publication payload preserves the exact generated period and overrides", () => {
  const payload = payslipPublicationPayload({
    startDate: "2026-07-25",
    endDate: "2026-08-25",
    adjustments: { paymentMode: "Transfer", incentive: 5000 },
    overrides: { shortHoursOverride: 123.45, incomeTaxOverride: "", unpaidLeaveOverride: 900 },
  });

  assert.deepEqual(payload, {
    startDate: "2026-07-25",
    endDate: "2026-08-25",
    paymentMode: "Transfer",
    incentive: 5000,
    shortHoursOverride: 123.45,
    incomeTaxOverride: "",
    unpaidLeaveOverride: 900,
  });
});
