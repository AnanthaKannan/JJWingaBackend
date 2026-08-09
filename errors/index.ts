export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean; // true = expected/handled error, false = programming bug
  public readonly code?: string;

  constructor(
    message: string,
    statusCode = 500,
    isOperational = true,
    code?: string,
  ) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    // Fixes prototype chain when compiling to ES5/target down-level
    Object.setPrototypeOf(this, new.target.prototype);

    // Excludes constructor from the stack trace
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, true, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  public readonly details?: Record<string, string>;

  constructor(message = "Validation failed", details?: Record<string, string>) {
    super(message, 400, true, "VALIDATION_ERROR");
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, true, "UNAUTHORIZED");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409, true, "CONFLICT");
  }
}
