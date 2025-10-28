import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ApiError } from "../errors/api-error";

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log the error
  request.log.error(error);

  // Handle known API errors
  if (error instanceof ApiError) {
    const apiErr = error as ApiError;
    return reply.status(apiErr.statusCode).send({
      error: {
        message: apiErr.message,
        code: apiErr.code,
        statusCode: apiErr.statusCode,
        ...(apiErr as any).details && { details: (apiErr as any).details },
      },
    });
  }

  // Handle Zod validation errors
  if (error.validation) {
    return reply.status(400).send({
      error: {
        message: "Validation error",
        code: "VALIDATION_ERROR",
        statusCode: 400,
        details: error.validation,
      },
    });
  }

  // Handle database errors
  if (error.code === "23505") {
    return reply.status(409).send({
      error: {
        message: "Resource already exists",
        code: "CONFLICT",
        statusCode: 409,
      },
    });
  }

  if (error.code === "23503") {
    return reply.status(409).send({
      error: {
        message: "Foreign key constraint violation",
        code: "FK_CONSTRAINT",
        statusCode: 409,
      },
    });
  }

  // Generic error handler
  return reply.status(error.statusCode || 500).send({
    error: {
      message: error.message || "Internal server error",
      code: "INTERNAL_ERROR",
      statusCode: error.statusCode || 500,
    },
  });
}

