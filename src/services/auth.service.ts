import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { User, IUser, Role } from '../models/User'
import { ApiError } from '../utils/ApiError'
import { RegisterInput, LoginInput } from '../validators/auth.validator'

const signToken = (id: string, role: Role): string =>
  jwt.sign({ id, role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions)

export const registerUser = async (data: RegisterInput): Promise<{ user: IUser; token: string }> => {
  const existingUsername = await User.findOne({ username: data.username })
  if (existingUsername) throw ApiError.conflict('Username is already taken')

  const existingEmail = await User.findOne({ email: data.email })
  if (existingEmail) throw ApiError.conflict('Email is already registered')

  // Self-registration is always viewer — role escalation goes through admin
  const user = await User.create({ ...data, role: 'viewer' })
  const token = signToken(user.id as string, user.role)

  return { user, token }
}

export const loginUser = async (data: LoginInput): Promise<{ user: IUser; token: string }> => {
  // Explicitly select password since it's excluded by default
  const user = await User.findOne({ username: data.username }).select('+password')

  if (!user || !(await user.comparePassword(data.password))) {
    throw ApiError.unauthorized('Invalid username or password')
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your account is deactivated. Please contact an administrator.')
  }

  const token = signToken(user.id as string, user.role)
  return { user, token }
}
