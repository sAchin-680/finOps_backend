import { User, IUser } from '../models/User'
import { ApiError } from '../utils/ApiError'
import { CreateUserInput, UpdateUserInput } from '../validators/user.validator'

export const createUser = async (data: CreateUserInput): Promise<IUser> => {
  const existingUsername = await User.findOne({ username: data.username })
  if (existingUsername) throw ApiError.conflict('Username is already taken')

  const existingEmail = await User.findOne({ email: data.email })
  if (existingEmail) throw ApiError.conflict('Email is already registered')

  return User.create(data)
}

export const getAllUsers = async (
  page: number,
  limit: number
): Promise<{ users: IUser[]; total: number; page: number; totalPages: number }> => {
  const skip = (page - 1) * limit
  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(),
  ])

  return { users, total, page, totalPages: Math.ceil(total / limit) }
}

export const getUserById = async (id: string): Promise<IUser> => {
  const user = await User.findById(id)
  if (!user) throw ApiError.notFound('User not found')
  return user
}

export const updateUser = async (id: string, data: UpdateUserInput, currentUserId: string): Promise<IUser> => {
  if (data.isActive === false && id === currentUserId) {
    throw ApiError.badRequest('You cannot deactivate your own account')
  }

  const user = await User.findById(id)
  if (!user) throw ApiError.notFound('User not found')

  if (data.email && data.email !== user.email) {
    const conflict = await User.findOne({ email: data.email, _id: { $ne: id } })
    if (conflict) throw ApiError.conflict('Email is already in use by another account')
  }

  Object.assign(user, data)
  await user.save()
  return user
}

export const deleteUser = async (id: string, currentUserId: string): Promise<void> => {
  if (id === currentUserId) {
    throw ApiError.badRequest('You cannot delete your own account')
  }

  const user = await User.findByIdAndDelete(id)
  if (!user) throw ApiError.notFound('User not found')
}
