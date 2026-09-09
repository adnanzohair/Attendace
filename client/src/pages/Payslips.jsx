import { useEffect, useState } from "react";
import { Mail, Printer } from "lucide-react";
import { api, messageOf } from "../services/api";
import { hours, Spinner } from "../components/ui";
import {
  deductionControl,
  shortHoursControl,
} from "../utils/payslipOverride";

const dateKey = (date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
const now = new Date(),
  initialStart = dateKey(new Date(now.getFullYear(), now.getMonth(), 25)),
  initialEnd = dateKey(new Date(now.getFullYear(), now.getMonth() + 1, 25));
const cash = (value) =>
  Number(value || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
const initialAdjustments = {
  paymentMode: "Transfer",
  shortHoursOverride: "",
  incomeTaxOverride: "",
  unpaidLeaveOverride: "",
  personalLoan: 0,
  advanceSalary: 0,
  professionalTax: 0,
  eobi: 400,
  providentFund: 0,
  otherDeduction: 0,
  overtime: 0,
  incentive: 0,
  yearlyBonus: 0,
  medicalReimbursement: 0,
  arrears: 0,
  loanGiven: 0,
  personalLoanBalance: 0,
  motorVehicleLoanBalance: 0,
  withholdingTax: 0,
  oldPfBalance: 0,
  newPfBalance: 0,
  employeePfShare: 0,
  employerPfShare: 0,
  pfWithdrawal: 0,
};
const adjustmentFields = [
  ["eobi", "E.O.B.I."],
  ["providentFund", "PF deduction"],
  ["personalLoan", "Personal loan"],
  ["advanceSalary", "Advance salary"],
  ["professionalTax", "Professional tax"],
  ["otherDeduction", "Other deduction"],
  ["overtime", "Manual overtime amount"],
  ["incentive", "Incentive"],
  ["yearlyBonus", "Yearly bonus"],
  ["medicalReimbursement", "Medical reimbursement"],
  ["arrears", "Arrears"],
  ["loanGiven", "Loan given"],
  ["personalLoanBalance", "Personal loan balance"],
  ["motorVehicleLoanBalance", "Motor vehicle loan balance"],
  ["withholdingTax", "Withholding tax"],
  ["oldPfBalance", "Old PF balance"],
  ["newPfBalance", "New PF balance"],
  ["employeePfShare", "Employee PF share"],
  ["employerPfShare", "Employer PF share"],
  ["pfWithdrawal", "PF withdrawal"],
];

export default function Payslips() {
  const [employees, setEmployees] = useState([]),
    [employeeId, setEmployeeId] = useState(""),
    [startDate, setStartDate] = useState(initialStart),
    [endDate, setEndDate] = useState(initialEnd);
  const [adjustments, setAdjustments] = useState(initialAdjustments),
    [shortHoursManual, setShortHoursManual] = useState(false),
    [incomeTaxManual, setIncomeTaxManual] = useState(false),
    [unpaidLeaveManual, setUnpaidLeaveManual] = useState(false),
    [payslip, setPayslip] = useState(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [mailStatus, setMailStatus] = useState({ configured: false, sender: null }),
    [sending, setSending] = useState(false);
  useEffect(() => {
    api
      .get("/employees", { params: { limit: 500 } })
      .then((r) => setEmployees(r.data.data))
      .catch((e) => setError(messageOf(e)));
  }, []);
  useEffect(() => {
    api.get("/payslips/mail/status").then((r) => setMailStatus(r.data)).catch(() => {});
  }, []);
  const update = (key, value) =>
    setAdjustments((current) => ({ ...current, [key]: value }));
  async function requestPayslip(
    nextAdjustments = adjustments,
    clearCurrent = false,
    shortManual = shortHoursManual,
    taxManual = incomeTaxManual,
    leaveManual = unpaidLeaveManual,
  ) {
    setLoading(true);
    setError("");
    if (clearCurrent) setPayslip(null);
    const control = shortHoursControl(
      payslip?.deductions?.shortHoursCalculated,
      nextAdjustments.shortHoursOverride,
      shortManual,
    );
    const taxControl = deductionControl(
      payslip?.deductions?.incomeTaxCalculated,
      nextAdjustments.incomeTaxOverride,
      taxManual,
    );
    const leaveControl = deductionControl(
      payslip?.deductions?.unpaidLeaveCalculated,
      nextAdjustments.unpaidLeaveOverride,
      leaveManual,
    );
    try {
      setPayslip(
        (
          await api.get(`/payslips/${employeeId}`, {
            params: {
              startDate,
              endDate,
              ...nextAdjustments,
              shortHoursOverride: control.queryValue,
              incomeTaxOverride: taxControl.queryValue,
              unpaidLeaveOverride: leaveControl.queryValue,
            },
          })
        ).data,
      );
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setLoading(false);
    }
  }
  async function generate(event) {
    event.preventDefault();
    await requestPayslip(adjustments, true);
  }
  async function testMail() {
    setError(""); setNotice(""); setSending(true);
    try {
      const { data } = await api.post("/payslips/mail/test");
      setNotice(data.message);
    } catch (e) { setError(messageOf(e)); }
    finally { setSending(false); }
  }
  async function emailPayslip() {
    if (!payslip) return;
    setError(""); setNotice(""); setSending(true);
    const control = shortHoursControl(payslip.deductions.shortHoursCalculated, adjustments.shortHoursOverride, shortHoursManual);
    const taxControl = deductionControl(payslip.deductions.incomeTaxCalculated, adjustments.incomeTaxOverride, incomeTaxManual);
    const leaveControl = deductionControl(payslip.deductions.unpaidLeaveCalculated, adjustments.unpaidLeaveOverride, unpaidLeaveManual);
    try {
      const { data } = await api.post(`/payslips/${employeeId}/email`, {
        startDate, endDate, ...adjustments,
        shortHoursOverride: control.queryValue,
        incomeTaxOverride: taxControl.queryValue,
        unpaidLeaveOverride: leaveControl.queryValue,
      });
      setNotice(data.message);
    } catch (e) { setError(messageOf(e)); }
    finally { setSending(false); }
  }
  async function applyShortHoursOverride() {
    await requestPayslip(adjustments);
  }
  async function resetShortHoursOverride() {
    setShortHoursManual(false);
    setAdjustments((current) => ({ ...current, shortHoursOverride: "" }));
    await requestPayslip(
      { ...adjustments, shortHoursOverride: "" },
      false,
      false,
    );
  }
  async function applyIncomeTaxOverride() {
    await requestPayslip(adjustments);
  }
  async function resetIncomeTaxOverride() {
    setIncomeTaxManual(false);
    setAdjustments((current) => ({ ...current, incomeTaxOverride: "" }));
    await requestPayslip(
      { ...adjustments, incomeTaxOverride: "" },
      false,
      shortHoursManual,
      false,
    );
  }
  async function applyUnpaidLeaveOverride() {
    await requestPayslip(adjustments);
  }
  async function resetUnpaidLeaveOverride() {
    setUnpaidLeaveManual(false);
    setAdjustments((current) => ({ ...current, unpaidLeaveOverride: "" }));
    await requestPayslip(
      { ...adjustments, unpaidLeaveOverride: "" },
      false,
      shortHoursManual,
      incomeTaxManual,
      false,
    );
  }
  const shortHours = shortHoursControl(
    payslip?.deductions?.shortHoursCalculated,
    adjustments.shortHoursOverride,
    shortHoursManual,
  );
  const incomeTax = deductionControl(
    payslip?.deductions?.incomeTaxCalculated,
    adjustments.incomeTaxOverride,
    incomeTaxManual,
  );
  const unpaidLeave = deductionControl(
    payslip?.deductions?.unpaidLeaveCalculated,
    adjustments.unpaidLeaveOverride,
    unpaidLeaveManual,
  );
  const selectedEmployee = employees.find((employee) => employee._id === employeeId);
  const isUsdEmployee = selectedEmployee?.salaryCurrency === "USD";
  return (
    <>
      <div className="no-print mb-6">
        <h1 className="page-title">Payslips</h1>
        <p className="muted mt-1">
          PKR salaries use the allowance and deduction structure. USD salaries
          are paid directly without perks or deductions.
        </p>
      </div>
      <form onSubmit={generate} className="no-print card mb-6 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-64 flex-1">
            <span className="label">Employee</span>
            <select
              className="field"
              value={employeeId}
              onChange={(e) => {
                const nextEmployee = employees.find((employee) => employee._id === e.target.value);
                setEmployeeId(e.target.value);
                setPayslip(null);
                setShortHoursManual(false);
                setIncomeTaxManual(false);
                setUnpaidLeaveManual(false);
                setAdjustments({
                  ...initialAdjustments,
                  eobi: nextEmployee?.salaryCurrency === "USD" ? 0 : initialAdjustments.eobi,
                });
              }}
              required
            >
              <option value="">Select an employee</option>
              {employees.map((x) => (
                <option key={x._id} value={x._id}>
                  {x.name} · {x.employeeId} · {x.salaryCurrency || "PKR"} · {x.status}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Start date</span>
            <input
              className="field"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPayslip(null);
                setShortHoursManual(false);
                setIncomeTaxManual(false);
                setUnpaidLeaveManual(false);
                update("shortHoursOverride", "");
                update("incomeTaxOverride", "");
                update("unpaidLeaveOverride", "");
              }}
              required
            />
          </label>
          <label>
            <span className="label">End date</span>
            <input
              className="field"
              type="date"
              min={startDate}
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPayslip(null);
                setShortHoursManual(false);
                setIncomeTaxManual(false);
                setUnpaidLeaveManual(false);
                update("shortHoursOverride", "");
                update("incomeTaxOverride", "");
                update("unpaidLeaveOverride", "");
              }}
              required
            />
          </label>
          <button disabled={loading} className="btn-primary">
            {loading ? "Calculating…" : "Generate payslip"}
          </button>
        </div>
        <details className="mt-4 border-t pt-4">
          <summary className="cursor-pointer text-sm font-semibold text-brand-700">
            Optional pay details, deductions and PF balances
          </summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label>
              <span className="label">Mode of payment</span>
              <select
                className="field"
                value={adjustments.paymentMode}
                onChange={(e) => update("paymentMode", e.target.value)}
              >
                <option>Transfer</option>
                <option>Cash</option>
                <option>Cheque</option>
              </select>
            </label>
            {isUsdEmployee && (
              <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 sm:col-span-2 lg:col-span-3">
                USD employee: the fixed salary is paid directly. Allowances,
                tax and attendance deductions do not apply. Optional manual
                additions and deductions below remain available.
              </div>
            )}
            {!isUsdEmployee && (
              <>
            <label>
              <span className="label">
                Short hours deduction{" "}
                <small
                  className={
                    shortHoursManual ? "text-amber-600" : "text-brand-600"
                  }
                >
                  ({shortHours.mode})
                </small>
              </span>
              <div className="flex gap-1">
                <input
                  className="field"
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={!payslip}
                  value={payslip ? shortHours.inputValue : ""}
                  placeholder="Generate payslip first"
                  onChange={(e) => {
                    setShortHoursManual(true);
                    update("shortHoursOverride", e.target.value);
                  }}
                />
                {shortHoursManual && (
                  <button
                    type="button"
                    disabled={loading}
                    className="btn-primary whitespace-nowrap px-2"
                    onClick={applyShortHoursOverride}
                  >
                    Apply
                  </button>
                )}
                {shortHoursManual && (
                  <button
                    type="button"
                    disabled={loading}
                    className="btn-secondary whitespace-nowrap px-2"
                    onClick={resetShortHoursOverride}
                  >
                    Reset auto
                  </button>
                )}
              </div>
              {payslip && (
                <span className="mt-1 block text-xs text-slate-500">
                  Calculated value:{" "}
                  {cash(payslip.deductions.shortHoursCalculated)}
                </span>
              )}
            </label>
            <label>
              <span className="label">
                Income tax at source{" "}
                <small
                  className={
                    incomeTaxManual ? "text-amber-600" : "text-brand-600"
                  }
                >
                  ({incomeTax.mode})
                </small>
              </span>
              <div className="flex gap-1">
                <input
                  className="field"
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={!payslip}
                  value={payslip ? incomeTax.inputValue : ""}
                  placeholder="Generate payslip first"
                  onChange={(e) => {
                    setIncomeTaxManual(true);
                    update("incomeTaxOverride", e.target.value);
                  }}
                />
                {incomeTaxManual && (
                  <button
                    type="button"
                    disabled={loading}
                    className="btn-primary whitespace-nowrap px-2"
                    onClick={applyIncomeTaxOverride}
                  >
                    Apply
                  </button>
                )}
                {incomeTaxManual && (
                  <button
                    type="button"
                    disabled={loading}
                    className="btn-secondary whitespace-nowrap px-2"
                    onClick={resetIncomeTaxOverride}
                  >
                    Reset auto
                  </button>
                )}
              </div>
              {payslip && (
                <span className="mt-1 block text-xs text-slate-500">
                  Calculated: {cash(payslip.tax.monthlyTax)} monthly · Tax Year{" "}
                  {payslip.tax.taxYear} · annual salary PKR{" "}
                  {cash(payslip.tax.annualTaxableSalary)} · annual tax PKR{" "}
                  {cash(payslip.tax.annualTax)}
                </span>
              )}
            </label>
            <label>
              <span className="label">
                Excess leave deduction{" "}
                <small
                  className={
                    unpaidLeaveManual ? "text-amber-600" : "text-brand-600"
                  }
                >
                  ({unpaidLeave.mode})
                </small>
              </span>
              <div className="flex gap-1">
                <input
                  className="field"
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={!payslip}
                  value={payslip ? unpaidLeave.inputValue : ""}
                  placeholder="Generate payslip first"
                  onChange={(e) => {
                    setUnpaidLeaveManual(true);
                    update("unpaidLeaveOverride", e.target.value);
                  }}
                />
                {unpaidLeaveManual && (
                  <button
                    type="button"
                    disabled={loading}
                    className="btn-primary whitespace-nowrap px-2"
                    onClick={applyUnpaidLeaveOverride}
                  >
                    Apply
                  </button>
                )}
                {unpaidLeaveManual && (
                  <button
                    type="button"
                    disabled={loading}
                    className="btn-secondary whitespace-nowrap px-2"
                    onClick={resetUnpaidLeaveOverride}
                  >
                    Reset auto
                  </button>
                )}
              </div>
              {payslip && (
                <span className="mt-1 block text-xs text-slate-500">
                  Calculated: {cash(payslip.deductions.unpaidLeaveCalculated)} ·{" "}
                  {payslip.leaveSummary.unpaidDaysInPeriod} unpaid day(s)
                </span>
              )}
            </label>
            {adjustmentFields.map(([key, label]) => (
              <NumberField
                key={key}
                label={label}
                value={adjustments[key]}
                onChange={(v) => update(key, v)}
              />
            ))}
              </>
            )}
            {isUsdEmployee && adjustmentFields.map(([key, label]) => (
              <NumberField
                key={key}
                label={`${label} (USD)`}
                value={adjustments[key]}
                onChange={(v) => update(key, v)}
              />
            ))}
          </div>
        </details>
      </form>
      <div className="no-print card mb-6 flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
        <div>
          <strong>Gmail payslip delivery:</strong>{" "}
          {mailStatus.configured ? `configured as ${mailStatus.sender}` : "not configured"}
        </div>
        <button type="button" className="btn-secondary" disabled={!mailStatus.configured || sending} onClick={testMail}>
          {sending ? "Checking…" : "Test SMTP connection"}
        </button>
      </div>
      {error && (
        <div className="no-print mb-4 rounded-lg bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}
      {notice && <div className="no-print mb-4 rounded-lg bg-green-50 p-3 text-green-800">{notice}</div>}
      {loading && !payslip && <Spinner />}
      {payslip && (
        <CompanySlip
          data={payslip}
          shortHoursOverride={shortHours.inputValue}
          shortHoursManual={shortHoursManual}
          onShortHoursChange={(value) => {
            setShortHoursManual(true);
            update("shortHoursOverride", value);
          }}
          onApplyShortHours={applyShortHoursOverride}
          onResetShortHours={resetShortHoursOverride}
          applying={loading}
          onEmail={emailPayslip}
          sending={sending}
        />
      )}
    </>
  );
}

function CompanySlip({
  data,
  shortHoursOverride,
  shortHoursManual,
  onShortHoursChange,
  onApplyShortHours,
  onResetShortHours,
  applying,
  onEmail,
  sending,
}) {
  const {
    employee,
    payment,
    leaveSummary: leaves,
    earnings: e,
    deductions: d,
    others: o,
    attendanceAnalysis: analysis,
  } = data;
  const month = new Date(`${data.period.endDate}T12:00:00`).toLocaleDateString(
    "en-GB",
    { month: "long", year: "numeric" },
  );
  const isUsd = employee.salaryCurrency === "USD";
  return (
    <article className="payslip mx-auto max-w-4xl bg-white p-5 text-[11px] text-black shadow-sm print:p-0">
      <div className="no-print mb-3 flex flex-wrap justify-end gap-2">
        <button className="btn-secondary" disabled={sending || !employee.email} onClick={onEmail}>
          <Mail size={17} />
          {sending ? "Sending…" : `Email PDF${employee.email ? ` to ${employee.email}` : ""}`}
        </button>
        <button className="btn-primary" onClick={() => window.print()}>
          <Printer size={17} />
          Print / Save PDF
        </button>
      </div>
      <div className="border-2 border-black">
        <header className="border-b-2 border-black bg-slate-200 py-2 text-center">
          <h2 className="text-xl font-extrabold">{data.company.name}</h2>
          <b>Pay Slip For The Month of {month}</b>
        </header>
        <div className="grid grid-cols-2 gap-x-12 border-b-2 border-black p-2">
          <Info label="Name" value={employee.name} />
          <Info label="Number of Days" value={payment.calendarDays} />
          <Info label="Payroll Working Days" value={data.policy.dynamicWorkingDays} />
          <Info label="Designation" value={employee.designation || "-"} />
          <Info label="Mode of Payment" value={payment.mode} />
          <Info label="Department" value={employee.department || "-"} />
          <Info
            label="Sick Leaves"
            value={`${leaves.sick.remaining} remaining · ${leaves.sick.usedInPeriod} used · ${leaves.sick.excessInPeriod} excess`}
          />
          <Info label="Employee ID" value={employee.employeeId} />
          <Info label="Salary Currency" value={employee.salaryCurrency} />
          <Info
            label="Casual Leaves"
            value={`${leaves.casual.remaining} remaining · ${leaves.casual.usedInPeriod} used (includes absence) · ${leaves.casual.excessInPeriod} excess`}
          />
        </div>
        <div className="grid grid-cols-[1.18fr_1fr_1fr]">
          <SlipSection
            title="EARNINGS"
            rows={isUsd ? [
              ["Direct Salary", e.directSalary],
              ["Manual Overtime", e.overtimePay],
              ["Incentive", e.incentive],
              ["Yearly Bonus", e.yearlyBonus],
              ["Loan Given", e.loanGiven],
              ["Medical Reimbursement", e.medicalReimbursement],
              ["Arrears", e.arrears],
            ] : [
              ["Basic Salary *", e.basicSalary],
              ["Accommodation Allowance", e.accommodationAllowance],
              ["Conveyance Allowance", e.conveyanceAllowance],
              ["Overtime", e.overtimePay],
              ["Medical Allowance", e.medicalAllowance],
              ["Incentive", e.incentive],
              ["Yearly Bonus", e.yearlyBonus],
              ["Loan Given", e.loanGiven],
              ["Medical Reimbursement", e.medicalReimbursement],
              ["Arrears", e.arrears],
            ]}
            totalLabel="Total Earnings"
            total={e.totalEarnings}
          />
          <SlipSection
            title="DEDUCTIONS"
            rows={isUsd ? [
              ["Personal Loan", d.personalLoan],
              ["Advance Salary", d.advanceSalary],
              ["Professional Tax", d.professionalTax],
              ["E.O.B.I.", d.eobi],
              ["PF Deduction", d.providentFund],
              ["Other Deduction", d.other],
            ] : [
              [
                `Income Tax At Source**${d.incomeTaxOverridden ? " (adjusted)" : ""}`,
                d.incomeTax,
              ],
              ["Personal Loan", d.personalLoan],
              ["Advance Salary", d.advanceSalary],
              ["Professional Tax", d.professionalTax],
              ["E.O.B.I.", d.eobi],
              ["PF Deduction", d.providentFund],
              ["Short Hours", d.shortHours],
              [
                `Excess Leave${d.unpaidLeaveOverridden ? " (adjusted)" : ""}`,
                d.unpaidLeave,
              ],
              ["Late", d.lateArrival],
              ["Other Deduction", d.other],
            ]}
            totalLabel="Total Deductions"
            total={d.total}
            shortEditor={isUsd ? null : {
              calculated: d.shortHoursCalculated,
              applied: d.shortHours,
              overridden: d.shortHoursOverridden,
              value: shortHoursOverride,
              manual: shortHoursManual,
              onChange: onShortHoursChange,
              onApply: onApplyShortHours,
              onReset: onResetShortHours,
              applying,
            }}
          />
          <SlipSection
            title="OTHERS"
            rows={[
              ["Personal Loan Balance", o.personalLoanBalance],
              ["Motor Vehicle Loan Balance", o.motorVehicleLoanBalance],
              ["Withholding Tax", o.withholdingTax],
              ["Number of Absents", analysis.absentDays],
              ["Number of Late", analysis.daysOver30Late],
              ["Old PF Balance", o.oldPfBalance],
              ["New PF Balance", o.newPfBalance],
              ["- Employee Share", o.employeePfShare],
              ["- Employer Share", o.employerPfShare],
              ["PF Withdrawal", o.pfWithdrawal],
            ]}
            totalLabel="Net PF Payable"
            total={o.newPfBalance}
          />
        </div>
        <div className="grid grid-cols-[120px_1fr] border-t-2 border-black bg-slate-200 text-sm font-extrabold">
          <div className="border-r border-black px-2 py-1">Net Payables</div>
          <div className="px-2 py-1 text-right">{employee.salaryCurrency} {cash(data.netSalary)}</div>
        </div>
        <div className="border-t-2 border-black p-2 leading-5">
          {isUsd ? (
            <div>
              USD fixed salary is paid directly without automatic perks, tax,
              or attendance deductions. Any displayed additions or deductions
              were entered manually for this payslip.
            </div>
          ) : (
            <>
              <div>
                * It is inclusive of all perquisites other than specifically
                mentioned.
              </div>
              <div>** Being deducted as per applicable Income Tax rules.</div>
              <div>
                Tax Year {data.tax.taxYear}: calculated monthly PKR{" "}
                {cash(data.tax.monthlyTax)} from annual taxable salary PKR{" "}
                {cash(data.tax.annualTaxableSalary)} and annual tax PKR{" "}
                {cash(data.tax.annualTax)}. Applied monthly PKR{" "}
                {cash(data.tax.appliedMonthlyTax)}
                {data.tax.overridden ? " (manually adjusted for this payslip)." : "."}
              </div>
            </>
          )}
          <div>
            *** Interest on loan using benchmark rate for the purpose of
            taxation.
          </div>
          <div className="mt-1">
            This slip is computer generated and does not require any signature.
          </div>
        </div>
      </div>
      <div className="mx-auto mt-4 grid max-w-xl grid-cols-5 border-2 border-black text-center">
        <Metric label="Short Hours" value={hours(analysis.shortMinutes)} />
        <Metric label="Over 30 Minutes Late" value={analysis.daysOver30Late} />
        <Metric label="Absents For Month" value={analysis.absentDays} />
        <Metric
          label="Incomplete Attendance"
          value={analysis.incompleteAttendanceDays}
        />
        <Metric label="Work From Home" value={analysis.workFromHomeDays} />
      </div>
    </article>
  );
}

function Info({ label, value }) {
  return (
    <div className="grid grid-cols-[115px_1fr] py-0.5">
      <b>{label}</b>
      <span>{value}</span>
    </div>
  );
}
function SlipSection({ title, rows, totalLabel, total, shortEditor }) {
  return (
    <section className="border-r border-black last:border-r-0">
      <h3 className="border-b-2 border-black bg-slate-200 py-1 text-center text-[10px] font-extrabold">
        {title}
      </h3>
      <div className="min-h-52 p-2">
        {rows.map(([label, value]) =>
          label === "Short Hours" && shortEditor ? (
            <ShortHoursEditor key={label} {...shortEditor} />
          ) : (
            <div key={label} className="flex justify-between gap-2 py-0.5">
              <span>{label}</span>
              <span>{value ? cash(value) : "-"}</span>
            </div>
          ),
        )}
      </div>
      <div className="flex justify-between border-t border-black bg-slate-200 px-2 py-1 font-extrabold">
        <span>{totalLabel}</span>
        <span>{cash(total)}</span>
      </div>
    </section>
  );
}
function ShortHoursEditor({
  calculated,
  applied,
  overridden,
  value,
  manual,
  onChange,
  onApply,
  onReset,
  applying,
}) {
  return (
    <div className="border-y border-dashed border-slate-400 py-1">
      <div className="flex justify-between gap-2">
        <span>Short Hours{overridden ? " (adjusted)" : ""}</span>
        <b>{applied ? cash(applied) : "-"}</b>
      </div>
      <div className="text-[9px] text-slate-500">
        Calculated: {cash(calculated)} · {manual ? "manual" : "inherited"}
      </div>
      <div className="no-print mt-1 flex gap-1">
        <input
          className="min-w-0 flex-1 rounded border border-slate-400 px-1 py-0.5 text-right text-[10px]"
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          disabled={applying}
          className="rounded bg-ink px-2 text-[9px] font-bold text-white"
          onClick={onApply}
        >
          {applying ? "Applying…" : "Apply"}
        </button>
        {manual && (
          <button
            type="button"
            disabled={applying}
            className="rounded border border-slate-400 px-1 text-[9px]"
            onClick={onReset}
          >
            Auto
          </button>
        )}
      </div>
    </div>
  );
}
function Metric({ label, value }) {
  return (
    <div className="border-r border-black last:border-r-0">
      <div className="flex h-14 items-center justify-center bg-slate-200 p-1 font-semibold">
        {label}
      </div>
      <div className="border-t border-black py-1">{value ?? "-"}</div>
    </div>
  );
}
function NumberField({ label, value, onChange }) {
  return (
    <label>
      <span className="label">{label}</span>
      <input
        className="field"
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
