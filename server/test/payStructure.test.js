import test from "node:test";
import assert from "node:assert/strict";

async function calculator() {
  try {
    return await import("../src/services/payStructure.js");
  } catch (error) {
    assert.fail(`Pay-structure calculator is unavailable: ${error.message}`);
  }
}

test("PKR salary keeps the allowance breakdown and payroll adjustments", async () => {
  const { buildPayStructure } = await calculator();
  assert.deepEqual(buildPayStructure(90000, "PKR"), {
    currency: "PKR",
    directSalary: 0,
    basicSalary: 45000,
    accommodationAllowance: 22500,
    conveyanceAllowance: 11250,
    medicalAllowance: 11250,
    allowsAutomaticAdjustments: true,
    allowsManualAdjustments: true,
    pakistanIncomeTaxApplicable: true,
  });
});

test("USD salary permits manual adjustments without automatic deductions", async () => {
  const { buildPayStructure } = await calculator();
  assert.deepEqual(buildPayStructure(1000, "USD"), {
    currency: "USD",
    directSalary: 1000,
    basicSalary: 0,
    accommodationAllowance: 0,
    conveyanceAllowance: 0,
    medicalAllowance: 0,
    allowsAutomaticAdjustments: false,
    allowsManualAdjustments: true,
    pakistanIncomeTaxApplicable: false,
  });
});
