import jwt from "jsonwebtoken";
import { EmployeeAccount } from "../models/index.js";
import { AppError, asyncHandler } from "../utils/http.js";

export const employeeAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.employeeToken || req.headers.authorization?.replace(/^Bearer /, "");
  if (!token) throw new AppError(401, "Employee authentication required");
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== "employee") throw new Error();
    const account = await EmployeeAccount.findById(payload.sub).populate("employee");
    if (!account || account.status !== "active" || account.employee?.status !== "active") throw new Error();
    req.employeeAccount = account;
    req.employee = account.employee;
    next();
  } catch {
    throw new AppError(401, "Invalid or expired employee session");
  }
});
