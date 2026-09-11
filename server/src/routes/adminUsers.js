import { Router } from "express";
import { User } from "../models/index.js";
import { auth } from "../middleware/auth.js";
import { ownerOnly } from "../middleware/ownerAuth.js";
import { AppError, asyncHandler } from "../utils/http.js";
import { createAccountToken } from "../services/accountTokens.js";
import { canManageAdmins, safeAdminUser } from "../services/adminAccessPolicy.js";
import { sendAdminInvitation } from "../services/adminAccountMailer.js";

const r = Router();
r.use(auth, ownerOnly);
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

async function issueInvitation(user) {
  const token = createAccountToken();
  user.active = false;
  user.accountState = "invited";
  user.inviteTokenHash = token.tokenHash;
  user.inviteExpiresAt = new Date(Date.now() + 3600000);
  user.passwordHash = undefined;
  await user.save();
  await sendAdminInvitation({
    recipient: user.email,
    name: user.name,
    url: `${process.env.CLIENT_URL}/admin/activate/${token.rawToken}`,
  });
}

r.get("/", asyncHandler(async (req, res) => {
  const users = await User.find().sort({ role: 1, name: 1 }).lean();
  res.json({ data: users.map((user) => safeAdminUser(user)) });
}));

r.post("/invite", asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  if (!name || !validEmail(email)) throw new AppError(422, "A name and valid email are required");
  const existing = await User.findOne({ email });
  if (existing?.active || existing?.accountState === "active") throw new AppError(409, "An active administrator already uses this email");
  const user = existing || new User({ name, email, role: "admin" });
  user.name = name;
  user.role = "admin";
  await issueInvitation(user);
  res.status(201).json({ message: `Administrator invitation sent to ${email}`, user: safeAdminUser(user) });
}));

r.post("/:id/resend", asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("+passwordHash +inviteTokenHash");
  if (!user || canManageAdmins(user)) throw new AppError(404, "Administrator invitation not found");
  if (user.accountState !== "invited") throw new AppError(409, "Only pending invitations can be resent");
  await issueInvitation(user);
  res.json({ message: `Invitation resent to ${user.email}` });
}));

r.patch("/:id/deactivate", asyncHandler(async (req, res) => {
  if (String(req.user._id) === req.params.id) throw new AppError(409, "You cannot deactivate your own account");
  const user = await User.findById(req.params.id);
  if (!user || canManageAdmins(user)) throw new AppError(404, "Administrator not found");
  user.active = false;
  user.accountState = "disabled";
  user.inviteTokenHash = undefined;
  user.inviteExpiresAt = undefined;
  await user.save();
  res.json({ message: `${user.name} has been deactivated` });
}));

r.post("/:id/reactivate", asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("+passwordHash");
  if (!user || canManageAdmins(user) || user.accountState !== "disabled") throw new AppError(404, "Disabled administrator not found");
  await issueInvitation(user);
  res.json({ message: `Reactivation invitation sent to ${user.email}` });
}));

export default r;
