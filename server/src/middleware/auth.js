import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { AppError, asyncHandler } from "../utils/http.js";
export const auth = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.token || req.headers.authorization?.replace(/^Bearer /, "");
  if (!token) throw new AppError(401, "Authentication required");
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).maxTimeMS(5000);
    if (!user?.active) throw new Error();
    req.user = user;
    next();
  } catch {
    throw new AppError(401, "Invalid or expired session");
  }
});
export const errorHandler = (err, req, res, next) => {
  console.error(err);
  if (err.name === "MongooseError" || err.code === 50)
    return res.status(503).json({ message: "Database request timed out. Check the MongoDB Atlas connection and IP access list." });
  if (err.code === 11000)
    return res
      .status(409)
      .json({
        message: "A record with this identifier already exists",
        fields: err.keyValue,
      });
  res
    .status(err.status || 500)
    .json({
      message: err.status ? err.message : "An unexpected error occurred",
      details: err.details,
    });
};
