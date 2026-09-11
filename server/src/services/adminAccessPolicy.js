const normalizedEmail = (value) => String(value || "").trim().toLowerCase();

export function effectiveAdminRole(user, configuredOwnerEmail = process.env.ADMIN_EMAIL) {
  if (user?.role === "owner" || (configuredOwnerEmail && normalizedEmail(user?.email) === normalizedEmail(configuredOwnerEmail))) return "owner";
  return user?.role || "admin";
}

export function canManageAdmins(user, configuredOwnerEmail = process.env.ADMIN_EMAIL) {
  return effectiveAdminRole(user, configuredOwnerEmail) === "owner";
}

export function safeAdminUser(user, configuredOwnerEmail = process.env.ADMIN_EMAIL) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: effectiveAdminRole(user, configuredOwnerEmail),
    active: Boolean(user.active),
    invitationPending: user.accountState === "invited",
    inviteExpiresAt: user.inviteExpiresAt,
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt,
  };
}
