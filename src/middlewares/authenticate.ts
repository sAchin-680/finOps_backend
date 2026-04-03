import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { ApiError } from '../utils/ApiError'
import { Role } from '../models/User'

interface JwtPayload {
  id: string
  role: Role
}

/**
 * Verifies the Bearer JWT token from the Authorization header.
 * On success, attaches { id, role } to req.user.
 */
const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('No token provided. Please log in.'))
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    req.user = { id: decoded.id, role: decoded.role }
    next()
  } catch {
    next(ApiError.unauthorized('Invalid or expired token. Please log in again.'))
  }
}

export default authenticate
