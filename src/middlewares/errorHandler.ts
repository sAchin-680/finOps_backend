import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../utils/ApiError'
import logger from '../utils/logger'

/**
 * Central error-handling middleware.
 * Must be registered LAST in app.ts (after all routes).
 *
 * Handles:
 *  - ApiError (operational errors — known, expected)
 *  - Mongoose validation/cast errors
 *  - Mongoose duplicate key errors
 *  - JWT errors (already converted to ApiError in authenticate middleware)
 *  - All other errors (500 — unexpected bugs)
 */
const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  // Operational error — we created it intentionally with ApiError
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    })
    return
  }

  // Mongoose cast error (e.g., invalid ObjectId in URL params)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'Invalid ID format',
    })
    return
  }

  // Mongoose duplicate key error (unique index violation)
  if ((err as NodeJS.ErrnoException).code === '11000') {
    const field = Object.keys((err as any).keyValue ?? {})[0] ?? 'field'
    res.status(409).json({
      success: false,
      message: `${field} already exists`,
    })
    return
  }

  // Mongoose schema validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values((err as any).errors).map((e: any) => e.message)
    res.status(400).json({
      success: false,
      message: messages.join('. '),
    })
    return
  }

  // Unknown / programmer error — log it and send generic response
  logger.error({ err, url: req.url, method: req.method }, 'Unhandled error')
  res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again later.',
  })
}

export default errorHandler
