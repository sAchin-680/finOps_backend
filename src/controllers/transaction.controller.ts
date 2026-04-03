import { Request, Response } from 'express'
import asyncHandler from '../utils/asyncHandler'
import * as transactionService from '../services/transaction.service'
import { TransactionQuery } from '../validators/transaction.validator'

// GET /transactions
export const getAllTransactions = asyncHandler(async (req: Request, res: Response) => {
  // Query params are already coerced by Zod validate middleware
  const query = req.query as unknown as TransactionQuery
  const result = await transactionService.getTransactions(query)
  res.status(200).json({ success: true, data: result })
})

// GET /transactions/:id
export const getTransactionById = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await transactionService.getTransactionById(req.params.id)
  res.status(200).json({ success: true, data: transaction })
})

// POST /transactions
export const createTransaction = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await transactionService.createTransaction(req.body, req.user!.id)
  res.status(201).json({
    success: true,
    message: 'Transaction created successfully',
    data: transaction,
  })
})

// PATCH /transactions/:id
export const updateTransaction = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await transactionService.updateTransaction(req.params.id, req.body)
  res.status(200).json({
    success: true,
    message: 'Transaction updated successfully',
    data: transaction,
  })
})

// DELETE /transactions/:id  (soft delete)
export const deleteTransaction = asyncHandler(async (req: Request, res: Response) => {
  await transactionService.softDeleteTransaction(req.params.id)
  res.status(200).json({ success: true, message: 'Transaction deleted successfully' })
})
