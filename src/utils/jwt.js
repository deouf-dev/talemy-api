import jwt from "jsonwebtoken";

/**
 * Generate JWT access token
 * @param {Object} payload
 * @returns {string} JWT token
 */
export function generateAccessToken(payload) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload must be a non-empty object");
  }
  if (!payload.sub || !payload.role) {
    throw new Error("Payload must not contain atleast 'sub' and 'role' fields");
  }
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}
/**
 *
 * @param {String} token
 * @returns {Object} decoded token payload
 */
export function verifyAccessToken(token) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return jwt.verify(token, process.env.JWT_SECRET);
}
