import { canManageAdmins } from "../services/adminAccessPolicy.js";
import { AppError } from "../utils/http.js";

export function ownerOnly(req, res, next) {
  if (!canManageAdmins(req.user)) return next(new AppError(403, "Owner access is required"));
  next();
}
