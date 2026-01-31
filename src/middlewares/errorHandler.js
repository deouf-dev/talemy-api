import { isAppError } from "../utils/errors.js";

export function errorHandler(err, req, res, next) {
  if (isAppError(err)) {
    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      details: err.details ?? null,
    });
  }

  console.error(err);

  return res.status(500).json({
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred.",
    details: null,
  });
}
