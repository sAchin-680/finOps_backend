import jwt from 'jsonwebtoken'
import { User } from '../models/User'
import { Transaction } from '../models/Transaction'
import mongoose from 'mongoose'

const JWT_SECRET = process.env.JWT_SECRET!

/** Create a user directly in DB and return a signed JWT for them */
export async function createUserWithToken(
  overrides: Partial<{
    username: string
    email: string
    password: string
    role: 'viewer' | 'analyst' | 'admin'
    isActive: boolean
  }> = {}
) {
  const suffix = new mongoose.Types.ObjectId().toHexString().slice(-6)
  const role = overrides.role ?? 'viewer'

  const user = await User.create({
    username: overrides.username ?? `user_${role}_${suffix}`,
    email: overrides.email ?? `${role}_${suffix}@test.com`,
    password: overrides.password ?? 'Password123',
    role,
    isActive: overrides.isActive ?? true,
  })

  const token = jwt.sign({ id: user._id.toString(), role: user.role }, JWT_SECRET, {
    expiresIn: '1h',
  })

  return { user, token }
}

/** Shorthand factories per role */
export const createAdmin = (overrides = {}) => createUserWithToken({ role: 'admin', ...overrides })
export const createAnalyst = (overrides = {}) =>
  createUserWithToken({ role: 'analyst', ...overrides })
export const createViewer = (overrides = {}) => createUserWithToken({ role: 'viewer', ...overrides })

/** Create a transaction directly in DB */
export async function createTransaction(
  createdBy: string,
  overrides: Partial<{
    amount: number
    type: 'income' | 'expense'
    category: string
    date: Date
    notes: string
    isDeleted: boolean
  }> = {}
) {
  return Transaction.create({
    amount: overrides.amount ?? 100.0,
    type: overrides.type ?? 'income',
    category: overrides.category ?? 'Salary',
    date: overrides.date ?? new Date('2024-01-15'),
    notes: overrides.notes,
    createdBy,
    isDeleted: overrides.isDeleted ?? false,
  })
}
