import { Router } from 'express'
import authenticate from '../middlewares/authenticate'
import authorize from '../middlewares/authorize'
import validate from '../middlewares/validate'
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionQuerySchema,
  txIdParamSchema,
} from '../validators/transaction.validator'
import {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transaction.controller'

const router = Router()

// All transaction routes require authentication
router.use(authenticate)

// Viewer, Analyst, Admin — read access
router.get('/', validate(transactionQuerySchema), getAllTransactions)
router.get('/:id', validate(txIdParamSchema), getTransactionById)

// Analyst + Admin — create and update
router.post('/', authorize('analyst', 'admin'), validate(createTransactionSchema), createTransaction)
router.patch('/:id', authorize('analyst', 'admin'), validate(updateTransactionSchema), updateTransaction)

// Admin only — delete (soft)
router.delete('/:id', authorize('admin'), validate(txIdParamSchema), deleteTransaction)

export default router
