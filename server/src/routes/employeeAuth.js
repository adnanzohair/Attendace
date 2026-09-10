import { Router } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Employee, EmployeeAccount } from "../models/index.js";
import { createAccountToken, hashAccountToken } from "../services/accountTokens.js";
import { employeeCookieOptions, tokenIsUsable, validPassword } from "../services/employeeAuthPolicy.js";
import { sendEmployeeAccountLink } from "../services/employeeAccountMailer.js";
import { employeeAuth } from "../middleware/employeeAuth.js";
import { AppError, asyncHandler } from "../utils/http.js";
import { safeEmployee } from "../services/employeeSafeView.js";

const r = Router(), limiter = rateLimit({ windowMs: 15 * 60000, limit: 20 });
r.use(limiter);
const neutral = { message: "If the email is registered, a secure link has been sent." };

r.post("/activate", asyncHandler(async (req, res) => {
  if (!validPassword(req.body.password)) throw new AppError(422, "Password must contain at least 10 characters");
  const hash = hashAccountToken(req.body.token || "");
  const account = await EmployeeAccount.findOne({ inviteTokenHash: hash }).select("+inviteTokenHash +inviteExpiresAt +passwordHash").populate("employee");
  if (!account || !tokenIsUsable({ expectedHash: account.inviteTokenHash, actualHash: hash, expiresAt: account.inviteExpiresAt }) || account.employee?.status !== "active") throw new AppError(422, "Invitation link is invalid or expired");
  account.passwordHash = await bcrypt.hash(req.body.password, 12); account.status = "active"; account.inviteTokenHash = undefined; account.inviteExpiresAt = undefined; account.passwordChangedAt = new Date(); await account.save();
  res.json({ message: "Password created. You can now sign in." });
}));
r.post("/login", asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const account = await EmployeeAccount.findOne({ email }).select("+passwordHash").populate("employee");
  if (!account || account.status !== "active" || account.employee?.status !== "active" || !(await bcrypt.compare(req.body.password || "", account.passwordHash || ""))) throw new AppError(401, "Invalid email or password");
  account.lastLoginAt = new Date(); await account.save();
  const token = jwt.sign({ sub: account._id, type: "employee" }, process.env.JWT_SECRET, { expiresIn: "8h" });
  res.cookie("employeeToken", token, employeeCookieOptions()).json({ employee: safeEmployee(account.employee) });
}));
r.post("/forgot-password", asyncHandler(async (req, res) => {
  const account = await EmployeeAccount.findOne({ email: String(req.body.email || "").trim().toLowerCase(), status: "active" }).populate("employee");
  if (account?.employee?.status === "active") {
    const token = createAccountToken(); account.resetTokenHash = token.tokenHash; account.resetExpiresAt = new Date(Date.now() + 3600000); await account.save();
    try {
      await sendEmployeeAccountLink({ recipient: account.email, employeeName: account.employee.name, purpose: "reset", url: `${process.env.CLIENT_URL}/employee/reset-password/${token.rawToken}` });
    } catch (error) {
      console.error("Employee password-reset email failed", error.message);
    }
  }
  res.json(neutral);
}));
r.post("/reset-password", asyncHandler(async (req, res) => {
  if (!validPassword(req.body.password)) throw new AppError(422, "Password must contain at least 10 characters");
  const hash = hashAccountToken(req.body.token || "");
  const account = await EmployeeAccount.findOne({ resetTokenHash: hash }).select("+resetTokenHash +resetExpiresAt +passwordHash");
  if (!account || !tokenIsUsable({ expectedHash: account.resetTokenHash, actualHash: hash, expiresAt: account.resetExpiresAt })) throw new AppError(422, "Reset link is invalid or expired");
  account.passwordHash = await bcrypt.hash(req.body.password, 12); account.resetTokenHash = undefined; account.resetExpiresAt = undefined; account.passwordChangedAt = new Date(); await account.save(); res.json({ message: "Password updated." });
}));
r.get("/me", employeeAuth, (req, res) => res.json({ employee: safeEmployee(req.employee) }));
r.post("/logout", (req, res) => { const { maxAge, ...options } = employeeCookieOptions(); res.clearCookie("employeeToken", options).status(204).end(); });
export default r;
