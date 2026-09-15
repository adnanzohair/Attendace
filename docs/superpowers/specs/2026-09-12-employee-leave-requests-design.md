# Employee Leave Requests Design

## Goal

Add an employee self-service leave request and Admin approval workflow that safely updates attendance and respects paid sick/casual balances in payroll.

## Request lifecycle

Employees submit a requested type (`sick`, `casual`, or `other`), inclusive start/end dates, and a required reason. They can see only their own Pending, Approved, and Rejected requests. Overlapping pending or approved requests are rejected.

Admins view all requests and approve or reject them with an optional note. On approval, Admin selects the final treatment: Sick Leave, Casual Leave, or Unpaid Leave. Company holidays and weekends are skipped automatically.

## Attendance integration

Each approved working day receives a reviewed Attendance record containing `Leave`, `Approved Leave`, and the final leave label. Actual/late/short/overtime minutes are zero. Approval refuses the entire request when any target day contains punches, a non-leave manual record, or finalized attendance; Admin must resolve or reopen that attendance first. An AttendanceAdjustment audit row records every created or replaced absence row.

## Payroll integration

Approved sick and casual leave consume their respective yearly grants. Days within the available grant have no deduction. Sick/casual days beyond the grant and all explicitly unpaid leave days contribute to `unpaidDaysInPeriod`. The existing payslip-specific unpaid-leave override remains available.

## Authorization

Employee identity always comes from `employeeToken`; request payloads cannot select another employee. Admin request management routes remain behind Admin/HR authentication. Rejected requests never change attendance.

## Interface

The employee portal gains **My Leave** with a request form and status history. The Admin portal gains **Leave Requests** with status/date filters, employee/type/reason details, and Approve/Reject controls.

## Validation

Dates must be valid, inclusive, start no earlier than today, end not before start, and span no more than 90 calendar days. Reasons are trimmed and limited to 1,000 characters.
