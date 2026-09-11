# Payroll Register Design

## Goal

Replace the Admin/HR Payroll placeholder with an auditable register of immutable published employee payslips.

## Responsibilities

- **Payslips** remains the calculation and publication workspace.
- **Payroll** becomes the historical register and operational management view.
- The register reads only stored `PublishedPayslip` snapshots; it never recalculates historical money.

## Admin API

`GET /api/payslips/published` accepts `startDate`, `endDate`, `search`, and `status`. It returns matching rows and currency-separated totals for employees, gross earnings, deductions, and net pay.

`GET /api/payslips/published/:id/download` returns the exact stored PDF snapshot. Existing retry-email and void routes remain the only mutation actions.

## Interface

The page defaults to the current 25th-to-25th payroll month and supports payroll-month or custom-range filtering. It displays PKR and USD totals separately, a searchable table, delivery/publication states, and actions to view, download, retry failed delivery, void, or open Payslips to create a replacement.

## Safety

All routes remain behind Admin/HR authentication. Voiding requires a reason. Published snapshot values are immutable and totals are never combined across currencies.

## Verification

Unit tests cover filters, currency totals, period labels, and PDF disposition. The full backend suite and frontend production build must pass.
