import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { AppError, asyncHandler } from "../utils/http.js";
import { auth } from "../middleware/auth.js";
const r = Router();
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
      .cookie("token", token, {
        httpOnly: true,
       sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
       secure: process.env.NODE_ENV === "production",
        maxAge: 28800000,
      })
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
r.post("/logout", (req, res) => res.clearCookie("token").status(204).end());
r.get("/me", auth, (req, res) => res.json({ user: req.user }));
export default r;
