import { assertOrThrow, AppError } from "../utils/errors.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  assertOrThrow(
    authHeader && authHeader.startsWith("Bearer "),
    401,
    "UNAUTHORIZED",
    "Authorization header missing or malformed",
  );

  const token = authHeader.split(" ")[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      role: payload.role,
    };
    return next();
  } catch (error) {
    throw new AppError(401, "UNAUTHORIZED", "Invalid or expired token");
  }
}
