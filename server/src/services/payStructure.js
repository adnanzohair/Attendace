const money = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export function buildPayStructure(monthlySalary, salaryCurrency = "PKR") {
  const salary = money(monthlySalary);
  const currency = salaryCurrency === "USD" ? "USD" : "PKR";
  if (currency === "USD") {
    return {
      currency,
      directSalary: salary,
      basicSalary: 0,
      accommodationAllowance: 0,
      conveyanceAllowance: 0,
      medicalAllowance: 0,
      allowsAutomaticAdjustments: false,
      allowsManualAdjustments: true,
      pakistanIncomeTaxApplicable: false,
    };
  }

  const basicSalary = money(salary * 0.5);
  const accommodationAllowance = money(salary * 0.25);
  const conveyanceAllowance = money(salary * 0.125);
  return {
    currency,
    directSalary: 0,
    basicSalary,
    accommodationAllowance,
    conveyanceAllowance,
    medicalAllowance: money(salary - basicSalary - accommodationAllowance - conveyanceAllowance),
    allowsAutomaticAdjustments: true,
    allowsManualAdjustments: true,
    pakistanIncomeTaxApplicable: true,
  };
}
