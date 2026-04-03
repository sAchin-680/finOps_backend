import request from 'supertest'
import app from '../app'
import { connectTestDb, disconnectTestDb, clearCollections } from './dbHelper'
import { createAdmin, createViewer, createAnalyst, createTransaction } from './testFactories'

beforeAll(async () => { await connectTestDb() })
afterAll(async () => { await disconnectTestDb() })
afterEach(async () => { await clearCollections() })

const SUMMARY_URL = '/api/dashboard/summary'

describe('GET /api/dashboard/summary', () => {
  it('returns 401 without auth token', async () => {
    const res = await request(app).get(SUMMARY_URL)
    expect(res.status).toBe(401)
  })

  it('returns correct summary structure for all roles', async () => {
    for (const factory of [createViewer, createAnalyst, createAdmin]) {
      const { token } = await factory()
      const res = await request(app).get(SUMMARY_URL).set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      const d = res.body.data
      expect(typeof d.totalIncome).toBe('number')
      expect(typeof d.totalExpense).toBe('number')
      expect(typeof d.netBalance).toBe('number')
      expect(typeof d.transactionCount).toBe('number')
      expect(d.categoryTotals).toBeInstanceOf(Array)
      expect(d.recentTransactions).toBeInstanceOf(Array)
      expect(d.monthlyTrends).toBeInstanceOf(Array)

      await clearCollections()
    }
  })

  it('computes correct totals from seeded transactions', async () => {
    const { user, token } = await createAdmin()
    const id = user._id.toString()

    await createTransaction(id, { type: 'income', amount: 3000 })
    await createTransaction(id, { type: 'income', amount: 2000 })
    await createTransaction(id, { type: 'expense', amount: 500 })

    const res = await request(app).get(SUMMARY_URL).set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.totalIncome).toBe(5000)
    expect(res.body.data.totalExpense).toBe(500)
    expect(res.body.data.netBalance).toBe(4500)
    expect(res.body.data.transactionCount).toBe(3)
  })

  it('excludes soft-deleted transactions from totals', async () => {
    const { user, token } = await createAdmin()
    const id = user._id.toString()

    await createTransaction(id, { type: 'income', amount: 1000 })
    await createTransaction(id, { type: 'income', amount: 9999, isDeleted: true })

    const res = await request(app).get(SUMMARY_URL).set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.totalIncome).toBe(1000) // deleted not counted
  })

  it('returns category totals grouped correctly', async () => {
    const { user, token } = await createAdmin()
    const id = user._id.toString()

    await createTransaction(id, { type: 'income', category: 'Salary', amount: 5000 })
    await createTransaction(id, { type: 'income', category: 'Salary', amount: 1000 })
    await createTransaction(id, { type: 'expense', category: 'Rent', amount: 1500 })

    const res = await request(app).get(SUMMARY_URL).set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    const salaryTotal = res.body.data.categoryTotals.find(
      (c: { category: string }) => c.category === 'Salary'
    )
    expect(salaryTotal).toBeDefined()
    expect(salaryTotal.total).toBe(6000)
    expect(salaryTotal.count).toBe(2)
  })

  it('recentTransactions returns at most 10 entries', async () => {
    const { user, token } = await createAdmin()
    const id = user._id.toString()

    for (let i = 0; i < 15; i++) {
      await createTransaction(id, { amount: 100 + i })
    }

    const res = await request(app).get(SUMMARY_URL).set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.recentTransactions.length).toBeLessThanOrEqual(10)
  })

  it('returns empty/zero values when no transactions exist', async () => {
    const { token } = await createViewer()
    const res = await request(app).get(SUMMARY_URL).set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.totalIncome).toBe(0)
    expect(res.body.data.totalExpense).toBe(0)
    expect(res.body.data.netBalance).toBe(0)
    expect(res.body.data.transactionCount).toBe(0)
    expect(res.body.data.categoryTotals).toHaveLength(0)
    expect(res.body.data.recentTransactions).toHaveLength(0)
  })
})
