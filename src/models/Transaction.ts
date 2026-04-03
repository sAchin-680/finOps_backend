import { Schema, model, Document, Types } from 'mongoose'

export type TransactionType = 'income' | 'expense'

export interface ITransaction extends Document {
  amount: number
  type: TransactionType
  category: string
  date: Date
  notes?: string
  createdBy: Types.ObjectId
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

const transactionSchema = new Schema<ITransaction>(
  {
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Transaction type is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [100, 'Category must be 100 characters or fewer'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes must be 500 characters or fewer'],
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

// Indexes for common filter/sort patterns
transactionSchema.index({ type: 1 })
transactionSchema.index({ category: 1 })
transactionSchema.index({ date: -1 })
transactionSchema.index({ isDeleted: 1 })
transactionSchema.index({ createdBy: 1 })

transactionSchema.set('toJSON', {
  transform: (_doc, ret) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = ret as any
    r.__v = undefined
    return r
  },
})

export const Transaction = model<ITransaction>('Transaction', transactionSchema)
