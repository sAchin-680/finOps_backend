import { Transaction, ITransaction } from '../models/Transaction'
import { ApiError } from '../utils/ApiError'
import { CreateTransactionInput, UpdateTransactionInput, TransactionQuery } from '../validators/transaction.validator'

export const createTransaction = async (
  data: CreateTransactionInput,
  userId: string
): Promise<ITransaction> => {
  return Transaction.create({ ...data, createdBy: userId })
}

export const getTransactions = async (
  query: TransactionQuery
): Promise<{ transactions: ITransaction[]; total: number; page: number; totalPages: number }> => {
  const { type, category, dateFrom, dateTo, page, limit } = query
  const filter: Record<string, unknown> = { isDeleted: false }

  if (type) filter.type = type
  if (category) filter.category = { $regex: category, $options: 'i' }
  if (dateFrom || dateTo) {
    filter.date = {}
    if (dateFrom) (filter.date as Record<string, Date>)['$gte'] = dateFrom
    if (dateTo) (filter.date as Record<string, Date>)['$lte'] = dateTo
  }

  const skip = (page - 1) * limit
  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'username email'),
    Transaction.countDocuments(filter),
  ])

  return { transactions, total, page, totalPages: Math.ceil(total / limit) }
}

export const getTransactionById = async (id: string): Promise<ITransaction> => {
  const tx = await Transaction.findOne({ _id: id, isDeleted: false }).populate(
    'createdBy',
    'username email'
  )
  if (!tx) throw ApiError.notFound('Transaction not found')
  return tx
}

export const updateTransaction = async (
  id: string,
  data: UpdateTransactionInput
): Promise<ITransaction> => {
  const tx = await Transaction.findOne({ _id: id, isDeleted: false })
  if (!tx) throw ApiError.notFound('Transaction not found')

  Object.assign(tx, data)
  await tx.save()
  return tx
}

export const softDeleteTransaction = async (id: string): Promise<void> => {
  const tx = await Transaction.findOne({ _id: id, isDeleted: false })
  if (!tx) throw ApiError.notFound('Transaction not found')

  tx.isDeleted = true
  await tx.save()
}
