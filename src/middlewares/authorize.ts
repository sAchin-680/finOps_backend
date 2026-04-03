import { Request, Response, NextFunction } from 'express'
import { Role } from '../models/User'
import { ApiError } from '../utils/ApiError'

/**
 * Role-based access control guard.
 * Usage: authorize('admin') or authorize('analyst', 'admin')
 *
 * Must be used AFTER the authenticate middleware.
 */
const authorize =
  (...allowedRoles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized())
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`
        )
      )
    }

    next()
  }

export default authorize
