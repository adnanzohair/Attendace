const money = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

export function annualSalaryTax2027(annualTaxableSalary) {
  const income = Number(annualTaxableSalary);
  if (!Number.isFinite(income) || income < 0)
    throw new RangeError(
      "Annual taxable salary must be zero or a positive number",
    );
  if (income <= 600000) return 0;
  if (income <= 1200000) return money((income - 600000) * 0.01);
  if (income <= 2200000) return money(6000 + (income - 1200000) * 0.11);
  if (income <= 3200000) return money(116000 + (income - 2200000) * 0.2);
  if (income <= 4100000) return money(316000 + (income - 3200000) * 0.25);
  if (income <= 5600000) return money(541000 + (income - 4100000) * 0.29);
  if (income <= 7000000) return money(976000 + (income - 5600000) * 0.32);
  return money(1424000 + (income - 7000000) * 0.35);
}

export function calculatePakistanSalaryTax(monthlySalary, payslipEndDate) {
  const monthly = Number(monthlySalary);
  if (!Number.isFinite(monthly) || monthly < 0)
    throw new RangeError("Monthly salary must be zero or a positive number");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(payslipEndDate || "") ||
    payslipEndDate < "2026-07-01" ||
    payslipEndDate > "2027-06-30"
  )
    throw new RangeError(
      "Pakistan salary tax is supported only for payslip periods ending from 2026-07-01 through 2027-06-30",
    );
  const annualTaxableSalary = money(monthly * 12),
    annualTax = annualSalaryTax2027(annualTaxableSalary);
  return {
    taxYear: 2027,
    annualTaxableSalary,
    annualTax,
    monthlyTax: money(annualTax / 12),
  };
}
