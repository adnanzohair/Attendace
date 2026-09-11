import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { AppError, asyncHandler } from "../utils/http.js";
import { auth } from "../middleware/auth.js";
import { hashAccountToken } from "../services/accountTokens.js";
import { tokenIsUsable, validPassword } from "../services/employeeAuthPolicy.js";
import { effectiveAdminRole, safeAdminUser } from "../services/adminAccessPolicy.js";
const r = Router();
export const authCookieOptions = (environment = process.env.NODE_ENV) => ({
  httpOnly: true,
  sameSite: environment === "production" ? "none" : "lax",
  secure: environment === "production",
  maxAge: 28800000,
});
r.post(
  "/activate-admin",
  asyncHandler(async (req, res) => {
    if (!validPassword(req.body.password)) throw new AppError(422, "Password must contain at least 10 characters");
    const tokenHash = hashAccountToken(req.body.token || "");
    const user = await User.findOne({ inviteTokenHash: tokenHash, accountState: "invited" }).select("+inviteTokenHash +passwordHash");
    if (!user || !tokenIsUsable({ expectedHash: user.inviteTokenHash, actualHash: tokenHash, expiresAt: user.inviteExpiresAt })) throw new AppError(422, "Administrator invitation is invalid or expired");
    user.passwordHash = await bcrypt.hash(req.body.password, 12);
    user.active = true;
    user.accountState = "active";
    user.inviteTokenHash = undefined;
    user.inviteExpiresAt = undefined;
    user.passwordChangedAt = new Date();
    await user.save();
    res.json({ message: "Administrator account activated. You can now sign in." });
  }),
);
r.post(
  "/login",
  asyncHandler(async (req, res) => {
    const user = await User.findOne({
      email: String(req.body.email).toLowerCase(),
      active: true,
    }).select("+passwordHash").maxTimeMS(5000);
    if (
      !user ||
      !(await bcrypt.compare(req.body.password || "", user.passwordHash || ""))
    )
      throw new AppError(401, "Invalid email or password");
    const role = effectiveAdminRole(user);
    if (role === "owner" && user.role !== "owner") user.role = "owner";
    user.accountState = "active";
    user.lastLoginAt = new Date();
    await user.save();
    const token = jwt.sign(
      { sub: user._id, role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );
    res
      .cookie("token", token, authCookieOptions())
      .json({
        user: safeAdminUser(user),
      });
  }),
);
r.post("/logout", (req, res) => {
  const { maxAge, ...options } = authCookieOptions();
  res.clearCookie("token", options).status(204).end();
});
r.get("/me", auth, (req, res) => res.json({ user: safeAdminUser(req.user) }));
export default r;
