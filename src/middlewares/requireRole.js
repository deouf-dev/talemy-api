import { AppError } from "../utils/index.js";

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, "UNAUTHORIZED", "User not authenticated"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(403, "FORBIDDEN", "User does not have the required role"),
      );
    }
    return next();
  };
}
