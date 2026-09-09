import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { AppError, asyncHandler } from "../utils/http.js";
import { auth } from "../middleware/auth.js";
const r = Router();
export const authCookieOptions = (environment = process.env.NODE_ENV) => ({
  httpOnly: true,
  sameSite: environment === "production" ? "none" : "lax",
  secure: environment === "production",
  maxAge: 28800000,
});
r.post(
  "/login",
  asyncHandler(async (req, res) => {
    const user = await User.findOne({
      email: String(req.body.email).toLowerCase(),
      active: true,
    }).select("+passwordHash").maxTimeMS(5000);
    if (
      !user ||
      !(await bcrypt.compare(req.body.password || "", user.passwordHash))
    )
      throw new AppError(401, "Invalid email or password");
    const token = jwt.sign(
      { sub: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );
    res
      .cookie("token", token, authCookieOptions())
      .json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
  }),
);
r.post("/logout", (req, res) => {
  const { maxAge, ...options } = authCookieOptions();
  res.clearCookie("token", options).status(204).end();
});
r.get("/me", auth, (req, res) => res.json({ user: req.user }));
export default r;
