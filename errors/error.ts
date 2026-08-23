import { NextFunction, Request, Response } from "express";

import logger from "../middleware/logger";
import { AppError, ValidationError } from ".";

function getRequestContext(req: Request) {
  return {
    method: req.method,
    url: req.originalUrl,
    userId: req?.user?.id ?? null,
    role: req?.user?.role ?? null,
    deviceId: req.headers["x-device-id"] || null,
    requestId: req.headers["x-request-id"] || null,
    ip: req.ip,
  };
}

export default function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const context = getRequestContext(req);

  // Known/operational errors — expected, log as warn, no stack noise needed
  if (err instanceof AppError) {
    if (!err.isOperational) {
      // Programming error that we chose to model as AppError - treat seriously
      logger.error(
        { err, ...context, code: err.code },
        "app_error_non_operational",
      );
    } else {
      logger.warn(
        { ...context, code: err.code, message: err.message },
        "app_error_handled",
      );
    }

    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      ...(err instanceof ValidationError && err.details
        ? { details: err.details }
        : {}),
    });
  }

  // Unknown/unhandled error - always log full detail server-side
  logger.error(
    {
      err: {
        message: err.message,
        stack: err.stack,
        name: err.name,
      },
      ...context,
    },
    "unhandled_request_error",
  );

  return res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again later.",
    error: err.message,
    stack: err.stack,
  });
}
