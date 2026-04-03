import { Request, Response } from 'express'
import asyncHandler from '../utils/asyncHandler'
import * as authService from '../services/auth.service'

// POST /auth/register
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await authService.registerUser(req.body)
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { user, token },
  })
})

// POST /auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await authService.loginUser(req.body)
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: { user, token },
  })
})
