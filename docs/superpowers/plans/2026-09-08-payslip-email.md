# Payslip Email Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send a server-calculated employee payslip as a PDF attachment through `adnan@tekglide.com` using Gmail SMTP.

**Architecture:** Extract payslip calculation from the HTTP route into reusable server logic, render the trusted result with PDFKit, and send it through a validated Nodemailer transport. A protected API exposes SMTP status/testing and payslip delivery, while the React UI triggers delivery using the employee's stored email and current payslip parameters.

**Tech Stack:** Node.js 22, Express 5, MongoDB/Mongoose, Nodemailer, PDFKit, React 19, Axios, Node test runner

**Spec:** `docs/superpowers/specs/2026-09-08-payslip-email-design.md`

## Global Constraints

- SMTP sender is `adnan@tekglide.com` through `smtp.gmail.com:465` with TLS.
- The Gmail App Password exists only in server environment variable `SMTP_APP_PASSWORD`.
- Never expose, persist, commit, or log the App Password.
- The recipient is always the selected employee's valid stored email address.
- Recalculate payslip data on the server; never accept client-authored totals.
- Automated tests use fake transports and never contact Gmail.
- PDF output supports both PKR and USD payslips.
- This workspace is not a Git repository, so commit steps are documented but must be skipped unless Git is initialized by the user.

---

### Task 1: SMTP configuration and dependencies

**Files:**
- Modify: `server/package.json`
- Modify: `package-lock.json`
- Modify: `.env.example`
- Create: `server/src/config/mail.js`
- Create: `server/test/mailConfig.test.js`

**Interfaces:**
- Produces: `readMailConfig(env): { host, port, secure, user, appPassword, fromName, fromAddress }`
- Produces: `publicMailStatus(env): { configured, sender }`

- [ ] **Step 1: Write failing configuration tests**

Test that valid Gmail variables return a normalized configuration, missing values throw `SMTP is not configured`, `SMTP_SECURE` parses as a boolean, and `publicMailStatus` never contains `appPassword`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test server/test/mailConfig.test.js`

Expected: FAIL because `server/src/config/mail.js` does not exist.

- [ ] **Step 3: Install runtime libraries**

Run: `npm install -w server nodemailer pdfkit`

- [ ] **Step 4: Implement strict configuration parsing**

`readMailConfig` must read `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_APP_PASSWORD`, and `SMTP_FROM_NAME`; validate port `1..65535`; and default the sender name to `Tekglide HR`. Return the secret only to server mail code. `publicMailStatus` catches missing configuration and returns only `{ configured, sender }`.

- [ ] **Step 5: Document environment keys without secrets**

Add:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=adnan@tekglide.com
SMTP_APP_PASSWORD=
SMTP_FROM_NAME=Tekglide HR
```

- [ ] **Step 6: Run the focused test and verify GREEN**

Run: `node --test server/test/mailConfig.test.js`

Expected: all mail configuration tests pass.

- [ ] **Step 7: Commit if Git becomes available**

```bash
git add server/package.json package-lock.json .env.example server/src/config/mail.js server/test/mailConfig.test.js
git commit -m "feat: add secure Gmail SMTP configuration"
```

### Task 2: Server-side payslip PDF renderer

**Files:**
- Create: `server/src/services/payslipPdf.js`
- Create: `server/test/payslipPdf.test.js`

**Interfaces:**
- Consumes: calculated payslip response object currently returned by `GET /api/payslips/:id`
- Produces: `renderPayslipPdf(payslip): Promise<Buffer>`

- [ ] **Step 1: Write failing PDF tests**

Create minimal PKR and USD payslip fixtures. Assert that each returned value is a non-empty `Buffer`, begins with `%PDF-`, contains the employee name, and contains `PKR` or `USD` respectively.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test server/test/payslipPdf.test.js`

Expected: FAIL because `renderPayslipPdf` is unavailable.

- [ ] **Step 3: Implement the renderer**

Create an A4 PDF with company heading, pay period, employee identity, working days, salary currency, leave balances, earnings, deductions, totals, attendance summary, and net salary. PKR uses allowance/tax rows; USD uses direct salary and manual adjustments. Collect PDFKit stream chunks and resolve `Buffer.concat(chunks)` after `end`.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test server/test/payslipPdf.test.js`

Expected: both currency cases pass.

- [ ] **Step 5: Commit if Git becomes available**

```bash
git add server/src/services/payslipPdf.js server/test/payslipPdf.test.js
git commit -m "feat: render payslips as PDF"
```

### Task 3: Testable Gmail delivery service

**Files:**
- Create: `server/src/services/mailService.js`
- Create: `server/test/mailService.test.js`

**Interfaces:**
- Consumes: `readMailConfig`, PDF `Buffer`, employee, and pay period
- Produces: `createMailTransport(config)`
- Produces: `buildPayslipMessage({ config, employee, period, pdf })`
- Produces: `sendPayslipEmail({ transport, config, employee, period, pdf }): Promise<{ messageId, accepted }>`

- [ ] **Step 1: Write failing message and delivery tests**

Assert that the message uses only `employee.email` as `to`, subject is `Payslip · <startDate> to <endDate>`, attachment filename is `payslip-<employeeId>-<startDate>-to-<endDate>.pdf`, MIME type is `application/pdf`, and a fake transport's `sendMail` result is normalized to `{ messageId, accepted }`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test server/test/mailService.test.js`

Expected: FAIL because the mail service does not exist.

- [ ] **Step 3: Implement transport, message construction, and sending**

Create Nodemailer transport with `{ host, port, secure, auth: { user, pass: appPassword }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 30000 }`. Validate employee email before calling the transport. Use a short plain-text and HTML body and attach the PDF buffer.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test server/test/mailService.test.js`

Expected: all assertions pass without network access.

- [ ] **Step 5: Commit if Git becomes available**

```bash
git add server/src/services/mailService.js server/test/mailService.test.js
git commit -m "feat: add payslip email service"
```

### Task 4: Reusable payslip calculation, email API, and audit log

**Files:**
- Create: `server/src/services/payslipService.js`
- Modify: `server/src/routes/payslips.js`
- Modify: `server/src/models/index.js`
- Create: `server/test/payslipEmail.test.js`

**Interfaces:**
- Produces: `calculatePayslip({ employeeId, query }): Promise<PayslipData>`
- Produces: `POST /api/payslips/:id/email` with the same query parameters as the GET endpoint
- Produces: `GET /api/payslips/mail/status`
- Produces: `POST /api/payslips/mail/test`
- Produces: Mongoose `PayslipEmail` audit model

- [ ] **Step 1: Write failing API/service tests**

Using injected calculator, renderer, and fake mail transport, test that the email handler recalculates by employee ID and query, refuses a missing/invalid employee email with status 422, sends only to the stored address, records `sent` audit metadata, records sanitized `failed` metadata on provider failure, and never includes SMTP secrets in the response or audit payload.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test server/test/payslipEmail.test.js`

Expected: FAIL because the delivery orchestrator and audit model are unavailable.

- [ ] **Step 3: Extract calculation without changing GET behavior**

Move the current body of `GET /:id` into `calculatePayslip({ employeeId, query })`. Keep all existing date, attendance, leave, tax, currency, grace, and override behavior. Make the GET handler return `res.json(await calculatePayslip(...))`.

- [ ] **Step 4: Add audit schema**

Store `employee`, `employeeId`, `recipient`, `period.startDate`, `period.endDate`, `sentBy`, `status` (`sent` or `failed`), `providerMessageId`, `errorCode`, and timestamps. Do not store attachments, passwords, or raw SMTP configuration.

- [ ] **Step 5: Implement status, verification, and delivery endpoints**

Define `/mail/status` and `/mail/test` before `/:id` so Express does not interpret `mail` as an employee ID. The test endpoint calls `transport.verify()`. The delivery endpoint calculates the payslip, renders the PDF, sends it, writes the audit entry, and returns `{ sent: true, recipient, messageId }`. Convert configuration/authentication/connectivity failures into sanitized `AppError` responses.

- [ ] **Step 6: Run focused and full server tests**

Run: `node --test server/test/payslipEmail.test.js && npm test`

Expected: email tests and all existing attendance/payroll tests pass.

- [ ] **Step 7: Commit if Git becomes available**

```bash
git add server/src/services/payslipService.js server/src/routes/payslips.js server/src/models/index.js server/test/payslipEmail.test.js
git commit -m "feat: expose audited payslip email API"
```

### Task 5: Payslip send button and SMTP status UI

**Files:**
- Modify: `client/src/pages/Payslips.jsx`
- Modify: `client/src/pages/Settings.jsx`
- Create: `client/src/utils/payslipEmail.js`
- Create: `server/test/payslipEmailParams.test.js`

**Interfaces:**
- Produces: `payslipEmailParams({ startDate, endDate, adjustments, shortHoursControl, incomeTaxControl, unpaidLeaveControl })`
- Consumes: `POST /payslips/:id/email`, `GET /payslips/mail/status`, `POST /payslips/mail/test`

- [ ] **Step 1: Write failing parameter test**

Test that email parameters include the exact selected dates and applied payslip override query values, while excluding display-only state and any recipient address.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test server/test/payslipEmailParams.test.js`

Expected: FAIL because the parameter helper does not exist.

- [ ] **Step 3: Implement parameter helper and Email PDF action**

Add an `Email PDF` button beside `Print / Save PDF`. Disable it during delivery, POST the same parameters used by the displayed payslip, and show `Payslip emailed to <stored employee email>` on success. Show API errors through `messageOf`.

- [ ] **Step 4: Add Settings SMTP status and test action**

Display configured/not-configured status and sender address. Add `Test SMTP Connection`, disable it while testing, and display a sanitized success or failure message. Do not render a credential field.

- [ ] **Step 5: Run focused test and production build**

Run: `node --test server/test/payslipEmailParams.test.js && npm run build`

Expected: parameter test passes and Vite completes successfully.

- [ ] **Step 6: Commit if Git becomes available**

```bash
git add client/src/pages/Payslips.jsx client/src/pages/Settings.jsx client/src/utils/payslipEmail.js server/test/payslipEmailParams.test.js
git commit -m "feat: email PDF payslips from the portal"
```

### Task 6: Final verification and operator handoff

**Files:**
- Modify: `README.md`

**Interfaces:**
- Documents: Gmail App Password setup location, restart commands, SMTP test, employee-email prerequisite, and send flow

- [ ] **Step 1: Add operator instructions**

Document that the 16-character Google App Password is placed in `.env` as `SMTP_APP_PASSWORD` without quotes or spaces, then the server is restarted. Document Settings → Test SMTP Connection and Payslips → Generate → Email PDF.

- [ ] **Step 2: Run complete verification**

Run:

```bash
npm test
npm run build
node --check server/src/routes/payslips.js
node --check server/src/services/payslipService.js
node --check server/src/services/payslipPdf.js
node --check server/src/services/mailService.js
```

Expected: zero test failures, successful production build, and zero syntax errors.

- [ ] **Step 3: Perform controlled live SMTP verification**

After the user adds `SMTP_APP_PASSWORD`, restart the server and use **Settings → Test SMTP Connection**. Then generate one payslip for an employee with a stored email and send it. Confirm the API returns `sent: true`, the audit record contains the Gmail message ID, and the recipient receives a readable PDF.

- [ ] **Step 4: Commit if Git becomes available**

```bash
git add README.md
git commit -m "docs: explain Gmail payslip delivery"
```
