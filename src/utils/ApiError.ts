/**
 * Custom operational error class.
 * Distinguishes expected errors (invalid input, not found, forbidden)
 * from programmer errors (bugs), so the error handler can respond correctly.
 */
export class ApiError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }

  static badRequest(message: string) {
    return new ApiError(400, message)
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message)
  }

  static forbidden(message = 'Access denied') {
    return new ApiError(403, message)
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message)
  }

  static conflict(message: string) {
    return new ApiError(409, message)
  }
}
