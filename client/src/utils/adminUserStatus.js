export function adminUserStatus(user) {
  if (user.role === "owner") return "Owner";
  if (user.invitationPending) return "Invitation pending";
  if (!user.active) return "Disabled";
  return "Active admin";
}
