import { z } from 'zod'

const typeEnum = z.enum(['income', 'expense'])

export const createTransactionSchema = z.object({
  body: z.object({
    amount: z
      .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
      .positive('Amount must be greater than 0')
      .multipleOf(0.01, 'Amount can have at most 2 decimal places'),
    type: typeEnum,
    category: z
      .string({ required_error: 'Category is required' })
      .min(1, 'Category cannot be empty')
      .max(100, 'Category must be 100 characters or fewer')
      .transform((v) => v.trim()),
    date: z.coerce.date({ required_error: 'Date is required', invalid_type_error: 'Invalid date format' }),
    notes: z
      .string()
      .max(500, 'Notes must be 500 characters or fewer')
      .optional()
      .nullable(),
  }),
})

export const updateTransactionSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Transaction ID is required'),
  }),
  body: z
    .object({
      amount: z
        .number({ invalid_type_error: 'Amount must be a number' })
        .positive('Amount must be greater than 0')
        .multipleOf(0.01, 'Amount can have at most 2 decimal places')
        .optional(),
      type: typeEnum.optional(),
      category: z
        .string()
        .min(1, 'Category cannot be empty')
        .max(100, 'Category must be 100 characters or fewer')
        .transform((v) => v.trim())
        .optional(),
      date: z.coerce.date({ invalid_type_error: 'Invalid date format' }).optional(),
      notes: z.string().max(500, 'Notes must be 500 characters or fewer').optional().nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
})

export const transactionQuerySchema = z.object({
  query: z.object({
    type: typeEnum.optional(),
    category: z.string().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
})

export const txIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Transaction ID is required'),
  }),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>['body']
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>['body']
export type TransactionQuery = z.infer<typeof transactionQuerySchema>['query']
