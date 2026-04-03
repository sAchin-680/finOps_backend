import { IUser } from '../models/User'

// Extend Express's Request interface to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        role: IUser['role']
      }
    }
  }
}
