# Payslip Email Delivery Design

## Goal

Allow an authenticated HR user to email the currently generated payslip as a PDF attachment through the company Gmail account. The recipient is always the selected employee's stored email address.

## Configuration

SMTP credentials are server-only environment variables:

- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=465`
- `SMTP_SECURE=true`
- `SMTP_USER=adnan@tekglide.com`
- `SMTP_APP_PASSWORD=<Google App Password>`
- `SMTP_FROM_NAME=Tekglide HR`

The App Password must never be returned by an API, displayed in the client, committed, or logged. Startup may continue without SMTP so attendance remains usable, but email endpoints report a clear configuration error.

## Server Components

1. A mail configuration module validates SMTP environment variables and creates a reusable Nodemailer transport.
2. A server-side PDFKit renderer creates a payslip PDF from trusted calculated payslip data. It supports both PKR and USD layouts and includes earnings, deductions, leave balances, attendance summary, period, and net salary.
3. Payslip calculation is exposed as reusable server logic so both the existing view endpoint and email endpoint calculate from the database and request adjustments. The server does not accept client-authored totals.
4. `POST /api/payslips/:employeeId/email` validates the employee email, recalculates the payslip, generates the PDF, sends it as an attachment, and returns a concise delivery result.
5. A protected SMTP verification endpoint tests authentication without sending a message.
6. An email audit collection records employee, recipient, payroll period, sender user, status, provider message ID or sanitized error, and timestamps. It never stores SMTP credentials.

## Client Flow

The generated payslip displays an **Email PDF** button beside **Print / Save PDF**. The button uses the current employee, date range, and payslip-only overrides/adjustments. While sending it is disabled and shows progress. Success identifies the stored recipient; failure displays a useful message.

Settings displays SMTP configuration status and a **Test SMTP Connection** button. It does not accept or reveal the App Password; configuration remains in `.env`.

## Validation and Error Handling

- Reject employees without a valid stored email.
- Reject invalid pay periods or adjustments through the existing payslip validation.
- Use request timeouts and return controlled errors for Gmail authentication, connection, and delivery failures.
- Do not expose raw SMTP errors or secrets to the browser.
- Prevent duplicate clicks while a send is active.

## Testing

- Unit-test SMTP configuration validation without real credentials.
- Unit-test email message construction, recipient enforcement, subject, and PDF attachment metadata.
- Unit-test PDF generation for PKR and USD payslips and verify a non-empty PDF signature.
- Test the email service with a fake transport; automated tests must not send real email.
- Run all server tests, backend syntax checks, and the production client build.

## Dependencies

- `nodemailer` for authenticated Gmail SMTP.
- `pdfkit` for server-side PDF generation without a browser runtime.
