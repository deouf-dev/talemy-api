import jwt from "jsonwebtoken";
import { AppError } from "../utils/errors.js";
import { verifyAccessToken } from "../utils/index.js";
export function socketAuth(socket, next) {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(
      new AppError(401, "UNAUTHORIZED", "Authentication token is required"),
    );
  }
  try {
    const decoded = verifyAccessToken(token);
    socket.user = {
      id: decoded.sub,
      role: decoded.role,
    };
    return next();
  } catch (error) {
    return next(
      new AppError(
        401,
        "UNAUTHORIZED",
        "Invalid or expired authentication token",
      ),
    );
  }
}
