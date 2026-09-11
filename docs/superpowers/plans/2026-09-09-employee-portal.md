# Employee Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build secure employee self-service authentication, scoped attendance/profile APIs, and immutable HR-published payslips.

**Architecture:** Separate employee credential records and route namespace enforce least privilege. Published payslips are immutable snapshots; employee identity always comes from the signed session. The React client gains a separate employee layout and uses same-origin Vercel API proxying.

**Tech Stack:** Express 5, MongoDB/Mongoose, JWT HTTP-only cookies, bcrypt, Nodemailer, PDFKit, React 19, React Router, Vite, Tailwind.

**Spec:** `docs/superpowers/specs/2026-09-09-employee-portal-design.md`

## Global Constraints

- Existing Admin/HR behavior remains available and employee tokens cannot access it.
- Employees access only the employee linked to their authenticated account.
- Only HR-published, non-void payslips appear to employees.
- August 2026 maps to 2026-07-25 through 2026-08-25 inclusive.
- Invitation and reset tokens are random, hashed at rest, single-use, and expire after one hour.
- Employee pages are responsive and never expose editing or administrative controls.

---

### Task 1: Security primitives and employee account model

**Files:**
- Modify: `server/src/models/index.js`
- Create: `server/src/services/accountTokens.js`
- Create: `server/src/services/employeeSafeView.js`
- Test: `server/test/employeeAccountSecurity.test.js`

**Interfaces:**
- Produces: `createAccountToken(): { rawToken, tokenHash }`, `hashAccountToken(rawToken): string`, `safeEmployee(employee): object`, Mongoose `EmployeeAccount`.

- [ ] Write failing tests for token hashing and safe employee fields.
- [ ] Run `node --test server/test/employeeAccountSecurity.test.js` and confirm failure from missing exports.
- [ ] Add the account schema, token service, and safe serializer.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: Invitation, activation, reset, and employee authentication

**Files:**
- Create: `server/src/middleware/employeeAuth.js`
- Create: `server/src/routes/employeeAuth.js`
- Create: `server/src/services/employeeAccountMailer.js`
- Modify: `server/src/app.js`
- Modify: `server/src/routes/employees.js`
- Test: `server/test/employeeAuth.test.js`

**Interfaces:**
- Consumes: `EmployeeAccount`, hashed account tokens, existing mail configuration.
- Produces: invite endpoint for HR and `/api/employee-portal/auth/{activate,login,forgot-password,reset-password,me,logout}`.

- [ ] Write failing tests for single-use expiry, inactive denial, neutral reset response, and employee token claims.
- [ ] Run the focused tests and confirm authorization behavior is absent.
- [ ] Implement rate-limited routes, invitation email, activation/reset, login cookies, and employee middleware.
- [ ] Re-run focused tests and confirm they pass.

### Task 3: Employee-scoped profile, dashboard, and attendance

**Files:**
- Create: `server/src/routes/employeePortal.js`
- Create: `server/src/services/payrollPeriod.js`
- Modify: `server/src/app.js`
- Test: `server/test/employeePortalScope.test.js`

**Interfaces:**
- Produces: `payrollPeriodForMonth("2026-08"): { startDate: "2026-07-25", endDate: "2026-08-25" }` and authenticated profile/dashboard/attendance endpoints.

- [ ] Write failing tests for period mapping and authenticated-employee-only query filters.
- [ ] Confirm focused tests fail.
- [ ] Implement safe profile, dashboard aggregates, date validation, and own-attendance records.
- [ ] Confirm focused tests pass.

### Task 4: Immutable payslip publication and employee downloads

**Files:**
- Modify: `server/src/models/index.js`
- Modify: `server/src/routes/payslips.js`
- Create: `server/src/services/payslipPublication.js`
- Modify: `server/src/routes/employeePortal.js`
- Test: `server/test/payslipPublication.test.js`

**Interfaces:**
- Produces: HR publish, retry-email, void-and-replace endpoints plus employee list/detail/PDF endpoints scoped by account employee.

- [ ] Write failing tests for immutable snapshots, uniqueness, failed-email persistence, void replacement, and ownership filters.
- [ ] Confirm focused tests fail.
- [ ] Implement publication service and routes using the existing calculator and PDF/email services.
- [ ] Confirm focused tests pass.

### Task 5: Employee portal frontend and HR actions

**Files:**
- Create: `client/src/context/EmployeeAuthContext.jsx`
- Create: `client/src/layouts/EmployeeLayout.jsx`
- Create: `client/src/pages/employee/EmployeeLogin.jsx`
- Create: `client/src/pages/employee/EmployeeActivate.jsx`
- Create: `client/src/pages/employee/EmployeeForgotPassword.jsx`
- Create: `client/src/pages/employee/EmployeeResetPassword.jsx`
- Create: `client/src/pages/employee/EmployeeDashboard.jsx`
- Create: `client/src/pages/employee/MyAttendance.jsx`
- Create: `client/src/pages/employee/MyPayslips.jsx`
- Create: `client/src/pages/employee/MyProfile.jsx`
- Modify: `client/src/App.jsx`
- Modify: `client/src/pages/Login.jsx`
- Modify: `client/src/pages/EmployeeDetail.jsx`
- Modify: `client/src/pages/Payslips.jsx`
- Test: `client/test/payrollPeriod.test.js`

**Interfaces:**
- Consumes: employee auth and self-service APIs; HR invitation/publish APIs.
- Produces: responsive employee-only navigation and read-only pages.

- [ ] Write failing client test for payroll-month parameters and portal route helpers.
- [ ] Confirm focused test fails.
- [ ] Implement employee auth context, protected routes, forms, dashboard, attendance, payslip downloads, profile, and HR controls.
- [ ] Confirm client test and production build pass.

### Task 6: Same-origin Vercel proxy and final verification

**Files:**
- Modify: `client/vercel.json`
- Modify: `client/src/services/api.js`
- Modify: `.env.example`
- Modify: `README.md`

**Interfaces:**
- Produces: first-party `/api` browser requests proxied to `API_UPSTREAM_URL` and documented deployment variables.

- [ ] Add a failing configuration test asserting API rewrite precedes SPA fallback.
- [ ] Add the `/api/:path*` rewrite and use `/api` as the production client base URL.
- [ ] Run all server tests with `npm test`.
- [ ] Run client tests and `npm run build`.
- [ ] Verify admin login, employee invite/activate/login, cross-employee denial, publish/email/download, reset, logout, direct SPA routes, and mobile layout.
