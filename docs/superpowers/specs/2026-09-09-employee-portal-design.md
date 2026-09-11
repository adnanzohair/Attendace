# Employee Portal Design

## Goal

Add a secure, responsive employee portal while preserving the existing Admin/HR experience. Employees authenticate with their stored employee email and can access only their own profile, attendance, leave balances, and HR-published payslips.

## Accounts and authentication

`EmployeeAccount` is a one-to-one credential record linked to `Employee`. It stores a unique normalized email, password hash, active state, activation status, password-change timestamp, and failed-login metadata. Credentials never live on the employee profile.

HR sends an invitation to an active employee with a unique email. The server stores only a SHA-256 hash of a cryptographically random, single-use token with a one-hour expiry. The employee follows the emailed link and creates a password. Forgot-password uses the same hashed, expiring, single-use mechanism and always returns a neutral response to prevent email enumeration. Passwords use bcrypt and existing HTTP-only cookie authentication with a distinct employee token claim.

Inactive employees cannot authenticate. Their account and historical records remain available to HR.

## Authorization boundary

Employee APIs live under `/api/employee-portal`. Authentication middleware derives the employee exclusively from the signed token and `EmployeeAccount.employee`; it never trusts an employee ID supplied by the browser. Record lookups include the authenticated employee identifier. Attempts to access another employee's payslip return 404.

Admin/HR APIs remain under their existing routes. Employee tokens are rejected by admin middleware, and admin tokens are not treated as employee sessions.

## Published payslips

`PublishedPayslip` stores an immutable structured snapshot of employee details, period, earnings, deductions, overrides, leave, attendance, net salary, template version, publishing user, publication timestamp, and delivery state. A unique active payslip exists per employee and period.

Publishing saves the snapshot before email delivery, makes it immediately visible in the portal, renders the PDF from that snapshot, and attempts delivery to the stored employee email. Email failure does not roll back publication; HR sees the failure and can retry. Corrections use Void and Replace: the old record remains in the audit history with void metadata and is hidden from the employee's normal list.

## Employee experience

The employee interface has its own layout and navigation: Dashboard, My Attendance, My Payslips, My Profile, and Sign Out. It contains no employee search, editing, imports, payroll configuration, manual adjustments, or unpublished salary calculations.

The dashboard uses the company's payroll-month convention. Selecting August 2026 means 25 July 2026 through 25 August 2026 inclusive. My Attendance supports this payroll-month selector and a custom date range, showing daily clock and calculated values. My Payslips lists only non-void published snapshots and provides read-only view/download. My Profile exposes only safe employee fields.

## Deployment and security

The frontend proxies `/api/*` to the deployed backend through Vercel so cookies remain first-party even when browsers block third-party cookies. Invitation/reset URLs use `CLIENT_URL`. All inputs are validated, reset/invite responses avoid account enumeration, tokens are single-use and expire, and rate limiting protects employee authentication endpoints.

## Testing

Unit tests cover payroll-period mapping, token hashing/expiry, account authorization, immutable publication rules, employee-scoped queries, and employee-safe serializers. Route tests cover invitation, activation, reset, login, cross-account denial, publish/email failure, void/replace, and download ownership. Client builds and server tests must remain green.
