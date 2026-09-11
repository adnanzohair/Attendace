import test from "node:test";
import assert from "node:assert/strict";
import { employeePayslipPdfUrl } from "../src/utils/employeePayslipPdfUrl.js";

test("creates same-origin employee payslip preview and download URLs", () => {
  assert.equal(employeePayslipPdfUrl("abc", true), "/api/employee-portal/payslips/abc/download?inline=1");
  assert.equal(employeePayslipPdfUrl("abc", false), "/api/employee-portal/payslips/abc/download");
});
