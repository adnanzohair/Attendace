# Employee Leave Requests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build secure employee leave requests, Admin approval, attendance synchronization, and paid-balance-aware payroll.

**Architecture:** Store requests separately from Attendance, then materialize approved working dates into audited Attendance rows. Employee and Admin APIs use separate authenticated namespaces; payroll reads only approved attendance records.

**Tech Stack:** Express 5, Mongoose, JWT cookies, React 19, React Router, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-12-employee-leave-requests-design.md`

## Global Constraints

- Available sick/casual balance produces no salary deduction.
- Excess sick/casual and explicitly unpaid leave produce unpaid-leave days.
- Weekends and active company holidays are excluded.
- Approval never silently overwrites punches or finalized attendance.
- Employees can access only their own requests.

---

### Task 1: Leave policy and request model

**Files:**
- Modify: `server/src/models/index.js`
- Create: `server/src/services/leaveRequestPolicy.js`
- Test: `server/test/leaveRequestPolicy.test.js`

**Interfaces:** Produces date validation, overlap filters, working-date expansion, and `LeaveRequest`.

- [ ] Write failing tests for date validation, overlap scoping, and weekend/holiday exclusion.
- [ ] Run the focused test and confirm missing exports fail.
- [ ] Implement the policy service and schema.
- [ ] Re-run the test and confirm green.

### Task 2: Paid balance payroll behavior

**Files:**
- Modify: `server/src/services/leaveEntitlement.js`
- Modify: `server/src/routes/payslips.js`
- Test: `server/test/leaveEntitlement.test.js`

**Interfaces:** Explicit `unpaid` events add deduction days without consuming sick/casual grants.

- [ ] Add a failing entitlement test for within-balance paid leave, excess leave, and explicit unpaid leave.
- [ ] Confirm the test fails for explicit unpaid handling.
- [ ] Implement explicit unpaid event handling and payslip event mapping.
- [ ] Confirm focused tests pass.

### Task 3: Employee request API

**Files:**
- Modify: `server/src/routes/employeePortal.js`
- Test: `server/test/leaveRequestPolicy.test.js`

**Interfaces:** Produces `GET/POST /api/employee-portal/leave-requests`, always scoped to `req.employee._id`.

- [ ] Test the authenticated-employee overlap filter contract.
- [ ] Implement list and create endpoints with validation and duplicate prevention.
- [ ] Run focused tests.

### Task 4: Admin approval and attendance materialization

**Files:**
- Create: `server/src/services/approvedLeaveAttendance.js`
- Create: `server/src/routes/leaveRequests.js`
- Modify: `server/src/app.js`
- Test: `server/test/approvedLeaveAttendance.test.js`

**Interfaces:** Produces conflict detection and leave attendance values; Admin routes list, approve, and reject requests.

- [ ] Write failing tests for approved attendance values and conflict classification.
- [ ] Implement preflight validation, audited attendance upserts, approval, and rejection.
- [ ] Confirm focused tests pass.

### Task 5: Employee and Admin interfaces

**Files:**
- Create: `client/src/pages/employee/MyLeave.jsx`
- Create: `client/src/pages/LeaveRequests.jsx`
- Modify: `client/src/layouts/EmployeeLayout.jsx`
- Modify: `client/src/layouts/AppLayout.jsx`
- Modify: `client/src/App.jsx`
- Test: `client/test/leaveRequestPresentation.test.js`

**Interfaces:** Responsive request form/history and Admin approval queue.

- [ ] Write a failing test for leave type/status presentation helpers.
- [ ] Implement helpers and both pages.
- [ ] Add routes and navigation.
- [ ] Confirm client tests and production build pass.

### Task 6: Verification

- [ ] Run `npm test` for the complete backend suite.
- [ ] Run all client Node tests.
- [ ] Run the Vite production build.
- [ ] Run `git diff --check`.
