export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, id?: string | number) {
    super(
      404,
      id ? `${resource} with id ${id} not found` : `${resource} not found`,
      "NOT_FOUND"
    );
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public details?: any) {
    super(400, message, "VALIDATION_ERROR");
  }
}

export class DatabaseError extends ApiError {
  constructor(message: string) {
    super(500, message, "DATABASE_ERROR");
  }
}

