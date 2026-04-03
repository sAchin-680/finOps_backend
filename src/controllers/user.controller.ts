import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import * as userService from '../services/user.service';
import { UsersQueryInput } from '../validators/user.validator';

// GET /users/me
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.user!.id);
  res.status(200).json({ success: true, data: user });
});

// GET /users
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as UsersQueryInput;
  const { page, limit } = query;
  const result = await userService.getAllUsers(page, limit);
  res.status(200).json({ success: true, data: result });
});

// GET /users/:id
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.id);
  res.status(200).json({ success: true, data: user });
});

// POST /users
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  res
    .status(201)
    .json({ success: true, message: 'User created successfully', data: user });
});

// PATCH /users/:id
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateUser(
    req.params.id,
    req.body,
    req.user!.id,
  );
  res
    .status(200)
    .json({ success: true, message: 'User updated successfully', data: user });
});

// DELETE /users/:id
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await userService.deleteUser(req.params.id, req.user!.id);
  res.status(200).json({ success: true, message: 'User deleted successfully' });
});
