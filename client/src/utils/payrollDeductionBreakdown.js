const amount = (value) => Number(value || 0);

export function payrollDeductionBreakdown(deductions = {}) {
  return {
    incomeTax: amount(deductions.incomeTax),
    shortHours: amount(deductions.shortHours),
    lateArrival: amount(deductions.lateArrival),
    excessLeave: amount(deductions.unpaidLeave),
    personalLoan: amount(deductions.personalLoan),
    advanceSalary: amount(deductions.advanceSalary),
    eobi: amount(deductions.eobi),
    providentFund: amount(deductions.providentFund),
    professionalTax: amount(deductions.professionalTax),
    other: amount(deductions.other),
    total: amount(deductions.total),
  };
}
