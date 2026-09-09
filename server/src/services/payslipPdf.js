import PDFDocument from "pdfkit";

const cash = (value) => Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 2 });
const duration = (minutes) => `${Math.floor((minutes || 0) / 60)}:${String((minutes || 0) % 60).padStart(2, "0")}`;
const valueOrDash = (value) => Number(value || 0) ? cash(value) : "-";

export function buildPayslipPdfModel(payslip) {
  const { employee, payment, leaveSummary: leaves, earnings: e, deductions: d, others: o, attendanceAnalysis: a } = payslip;
  const isUsd = employee.salaryCurrency === "USD";
  return {
    sectionTitles: ["EARNINGS", "DEDUCTIONS", "OTHERS"],
    info: [
      ["Name", employee.name], ["Number of Days", payment.calendarDays],
      ["Payroll Working Days", payslip.policy.dynamicWorkingDays], ["Designation", employee.designation || "-"],
      ["Mode of Payment", payment.mode], ["Department", employee.department || "-"],
      ["Sick Leaves", `${leaves.sick.remaining} remaining · ${leaves.sick.usedInPeriod} used · ${leaves.sick.excessInPeriod} excess`],
      ["Employee ID", employee.employeeId], ["Salary Currency", employee.salaryCurrency],
      ["Casual Leaves", `${leaves.casual.remaining} remaining · ${leaves.casual.usedInPeriod} used (includes absence) · ${leaves.casual.excessInPeriod} excess`],
    ],
    earnings: isUsd ? [
      ["Direct Salary", e.directSalary], ["Manual Overtime", e.overtimePay], ["Incentive", e.incentive],
      ["Yearly Bonus", e.yearlyBonus], ["Loan Given", e.loanGiven], ["Medical Reimbursement", e.medicalReimbursement], ["Arrears", e.arrears],
    ] : [
      ["Basic Salary *", e.basicSalary], ["Accommodation Allowance", e.accommodationAllowance],
      ["Conveyance Allowance", e.conveyanceAllowance], ["Overtime", e.overtimePay], ["Medical Allowance", e.medicalAllowance],
      ["Incentive", e.incentive], ["Yearly Bonus", e.yearlyBonus], ["Loan Given", e.loanGiven],
      ["Medical Reimbursement", e.medicalReimbursement], ["Arrears", e.arrears],
    ],
    deductions: isUsd ? [
      ["Personal Loan", d.personalLoan], ["Advance Salary", d.advanceSalary], ["Professional Tax", d.professionalTax],
      ["E.O.B.I.", d.eobi], ["PF Deduction", d.providentFund], ["Other Deduction", d.other],
    ] : [
      [`Income Tax At Source**${d.incomeTaxOverridden ? " (adjusted)" : ""}`, d.incomeTax],
      ["Personal Loan", d.personalLoan], ["Advance Salary", d.advanceSalary], ["Professional Tax", d.professionalTax],
      ["E.O.B.I.", d.eobi], ["PF Deduction", d.providentFund],
      [`Short Hours${d.shortHoursOverridden ? " (adjusted)" : ""}`, d.shortHours],
      [`Excess Leave${d.unpaidLeaveOverridden ? " (adjusted)" : ""}`, d.unpaidLeave],
      ["Late", d.lateArrival], ["Other Deduction", d.other],
    ],
    others: [
      ["Personal Loan Balance", o.personalLoanBalance], ["Motor Vehicle Loan Balance", o.motorVehicleLoanBalance],
      ["Withholding Tax", o.withholdingTax], ["Number of Absents", a.absentDays], ["Number of Late", a.daysOver30Late],
      ["Old PF Balance", o.oldPfBalance], ["New PF Balance", o.newPfBalance], ["- Employee Share", o.employeePfShare],
      ["- Employer Share", o.employerPfShare], ["PF Withdrawal", o.pfWithdrawal],
    ],
    totals: [["Total Earnings", e.totalEarnings], ["Total Deductions", d.total], ["Net PF Payable", o.newPfBalance]],
    metrics: [
      ["Short Hours", duration(a.shortMinutes)], ["Over 30 Minutes Late", a.daysOver30Late],
      ["Absents For Month", a.absentDays], ["Incomplete Attendance", a.incompleteAttendanceDays],
      ["Work From Home", a.workFromHomeDays],
    ],
  };
}

function cell(doc, x, y, width, label, value) {
  doc.font("Helvetica-Bold").fontSize(6.8).text(label, x + 5, y + 3, { width: width * 0.42, lineBreak: false });
  doc.font("Helvetica").text(String(value), x + width * 0.42, y + 3, { width: width * 0.56, lineBreak: false });
}

function tableSection(doc, { x, y, width, height, title, rows, total }) {
  doc.rect(x, y, width, height).stroke("#111111");
  doc.rect(x, y, width, 17).fillAndStroke("#d9dde1", "#111111");
  doc.fillColor("#111111").font("Helvetica-Bold").fontSize(7).text(title, x, y + 5, { width, align: "center" });
  rows.forEach(([label, value], index) => {
    const rowY = y + 21 + index * 15;
    doc.font("Helvetica").fontSize(6.4).text(label, x + 5, rowY, { width: width - 56, lineBreak: false });
    doc.text(valueOrDash(value), x + width - 52, rowY, { width: 47, align: "right", lineBreak: false });
  });
  const totalY = y + height - 19;
  doc.moveTo(x, totalY).lineTo(x + width, totalY).stroke();
  doc.font("Helvetica-Bold").fontSize(6.6).text(total[0], x + 5, totalY + 5, { width: width - 60 });
  doc.text(valueOrDash(total[1]), x + width - 55, totalY + 5, { width: 50, align: "right" });
}

export function renderPayslipPdf(payslip) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 42, compress: false });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    const model = buildPayslipPdfModel(payslip);
    const currency = payslip.employee.salaryCurrency || "PKR";
    const month = new Date(`${payslip.period.endDate}T12:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    doc.info.Title = `Payslip ${payslip.employee.employeeId} ${payslip.period.startDate} to ${payslip.period.endDate}`;
    const left = 42, pageWidth = 511;
    doc.rect(left, 58, pageWidth, 54).fillAndStroke("#d9dde1", "#111111");
    doc.fillColor("#111111").font("Helvetica-Bold").fontSize(17).text(payslip.company.name, left, 70, { width: pageWidth, align: "center" });
    doc.fontSize(9).text(`Pay Slip For The Month of ${month}`, left, 94, { width: pageWidth, align: "center" });
    const infoY = 112, infoHeight = 102, half = pageWidth / 2;
    doc.rect(left, infoY, pageWidth, infoHeight).stroke();
    doc.moveTo(left + half, infoY).lineTo(left + half, infoY + infoHeight).stroke();
    model.info.forEach(([label, value], index) => cell(doc, left + (index % 2) * half, infoY + 4 + Math.floor(index / 2) * 18, half, label, value));
    const tableY = infoY + infoHeight, tableHeight = 206, widths = [201, 155, 155];
    let x = left;
    [model.earnings, model.deductions, model.others].forEach((rows, index) => {
      tableSection(doc, { x, y: tableY, width: widths[index], height: tableHeight, title: model.sectionTitles[index], rows, total: model.totals[index] });
      x += widths[index];
    });
    const netY = tableY + tableHeight;
    doc.rect(left, netY, pageWidth, 24).fillAndStroke("#d9dde1", "#111111");
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#111111").text("Net Payables", left + 6, netY + 7);
    doc.text(`${currency} ${cash(payslip.netSalary)}`, left + 260, netY + 7, { width: 244, align: "right" });
    const notesY = netY + 24, isUsd = currency === "USD";
    doc.rect(left, notesY, pageWidth, 104).stroke();
    doc.font("Helvetica").fontSize(6.3).fillColor("#111111");
    let notes = isUsd
      ? "USD fixed salary is paid directly without automatic perks, tax, or attendance deductions. Any displayed additions or deductions were entered manually for this payslip."
      : `* It is inclusive of all perquisites other than specifically mentioned.\n** Being deducted as per applicable Income Tax rules.\nTax Year ${payslip.tax?.taxYear || "-"}: calculated monthly PKR ${cash(payslip.tax?.monthlyTax)} from annual taxable salary PKR ${cash(payslip.tax?.annualTaxableSalary)} and annual tax PKR ${cash(payslip.tax?.annualTax)}. Applied monthly PKR ${cash(payslip.tax?.appliedMonthlyTax)}${payslip.tax?.overridden ? " (manually adjusted for this payslip)." : "."}`;
    notes += "\n*** Interest on loan using benchmark rate for the purpose of taxation.\nThis slip is computer generated and does not require any signature.";
    doc.text(notes, left + 7, notesY + 8, { width: pageWidth - 14, lineGap: 3 });
    const metricY = notesY + 120, metricWidth = pageWidth / model.metrics.length;
    model.metrics.forEach(([label, value], index) => {
      const metricX = left + index * metricWidth;
      doc.rect(metricX, metricY, metricWidth, 50).stroke();
      doc.font("Helvetica-Bold").fontSize(6.2).text(label, metricX + 3, metricY + 7, { width: metricWidth - 6, align: "center" });
      doc.font("Helvetica").fontSize(7).text(String(value), metricX + 3, metricY + 31, { width: metricWidth - 6, align: "center" });
    });
    doc.end();
  });
}

export function payslipPdfIdentity(payslip) {
  return { employeeName: payslip.employee.name, currency: payslip.employee.salaryCurrency || "PKR" };
}
