/**
 * @typedef {'VALIDATION_ERROR'|'CONFLICT'|'UNAUTHORIZED'|'FORBIDDEN'|'NOT_FOUND'|'INTERNAL_ERROR'} ErrorCode
 */

export class AppError extends Error {
  /**
   * @param {number} statusCode
   * @param {ErrorCode} code
   * @param {string} message
   * @param {object} [details]
   */
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function isAppError(err) {
  return err instanceof AppError;
}

/**
 * Throw an AppError if condition is falsy.
 * @param {any} condition
 * @param {number} statusCode
 * @param {ErrorCode} code
 * @param {string} message
 * @param {object} [details]
 */
export function assertOrThrow(condition, statusCode, code, message, details) {
  if (!condition) {
    throw new AppError(statusCode, code, message, details);
  }
}
