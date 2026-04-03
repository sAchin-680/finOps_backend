import { Transaction } from '../models/Transaction'

interface CategoryTotal {
  category: string
  total: number
  count: number
}

interface MonthlyTrend {
  year: number
  month: number
  income: number
  expense: number
  net: number
}

interface RecentTransaction {
  _id: string
  amount: number
  type: string
  category: string
  date: Date
  notes?: string | null
}

export interface DashboardSummary {
  totalIncome: number
  totalExpense: number
  netBalance: number
  transactionCount: number
  categoryTotals: CategoryTotal[]
  recentTransactions: RecentTransaction[]
  monthlyTrends: MonthlyTrend[]
}

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const baseMatch = { isDeleted: false }

  // Run all aggregations in parallel for performance
  const [totalsResult, categoryResult, recentResult, monthlyResult] = await Promise.all([
    // 1. Total income, expense, and count
    Transaction.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),

    // 2. Per-category totals (all types combined)
    Transaction.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      {
        $project: {
          _id: 0,
          category: '$_id',
          total: { $round: ['$total', 2] },
          count: 1,
        },
      },
    ]),

    // 3. 10 most recent transactions
    Transaction.find(baseMatch)
      .sort({ date: -1 })
      .limit(10)
      .select('amount type category date notes')
      .lean(),

    // 4. Monthly income vs expense trends
    Transaction.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ])

  // Process totals
  let totalIncome = 0
  let totalExpense = 0
  let transactionCount = 0
  for (const row of totalsResult) {
    if (row._id === 'income') { totalIncome = row.total; transactionCount += row.count }
    if (row._id === 'expense') { totalExpense = row.total; transactionCount += row.count }
  }

  // Process monthly trends into a clean map
  const monthlyMap = new Map<string, { year: number; month: number; income: number; expense: number }>()
  for (const row of monthlyResult) {
    const key = `${row._id.year}-${row._id.month}`
    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, { year: row._id.year, month: row._id.month, income: 0, expense: 0 })
    }
    const entry = monthlyMap.get(key)!
    if (row._id.type === 'income') entry.income = Math.round(row.total * 100) / 100
    if (row._id.type === 'expense') entry.expense = Math.round(row.total * 100) / 100
  }

  const monthlyTrends: MonthlyTrend[] = Array.from(monthlyMap.values()).map((m) => ({
    ...m,
    net: Math.round((m.income - m.expense) * 100) / 100,
  }))

  return {
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpense: Math.round(totalExpense * 100) / 100,
    netBalance: Math.round((totalIncome - totalExpense) * 100) / 100,
    transactionCount,
    categoryTotals: categoryResult as CategoryTotal[],
    recentTransactions: recentResult as unknown as RecentTransaction[],
    monthlyTrends,
  }
}
