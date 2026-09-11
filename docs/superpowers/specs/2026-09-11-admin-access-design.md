# Multi-Admin Access Design

## Roles

- **Owner:** full operational access and exclusive administrator-account management.
- **Admin:** full access to employees, attendance, imports, holidays, payroll, payslips, and settings, but no access to administrator management.
- Existing employee accounts remain isolated from Admin/HR authentication.

The account matching `ADMIN_EMAIL` is promoted to Owner when it signs in, providing a safe migration for the existing deployment.

## Invitation flow

The Owner creates an administrator invitation using name and email. The server stores only a hashed, one-hour, single-use token and emails a frontend activation link. The invited administrator creates a password of at least ten characters and can then use the existing Admin/HR login.

## Management

The Admin Users page lists status, invitation expiry, creation time, and last login. The Owner can invite, resend an expired invitation, deactivate an active admin, or reactivate one by sending a fresh invitation. The Owner cannot deactivate their own account, and non-owners cannot access these endpoints even by direct API requests.

## Security

Passwords use bcrypt cost 12. Account-management endpoints require server-side Owner authorization. Deactivation invalidates access on the next authenticated request because middleware reloads the user from MongoDB.
