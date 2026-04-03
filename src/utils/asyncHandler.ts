import { Request, Response, NextFunction, RequestHandler } from 'express'

/**
 * Wraps an async route handler so that any thrown error
 * is automatically forwarded to Express's next(err) — no try/catch needed in controllers.
 */
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }

export default asyncHandler
