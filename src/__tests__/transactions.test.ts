import request from 'supertest'
import app from '../app'
import { connectTestDb, disconnectTestDb, clearCollections } from './dbHelper'
import { createAdmin, createAnalyst, createViewer, createTransaction } from './testFactories'

beforeAll(async () => { await connectTestDb() })
afterAll(async () => { await disconnectTestDb() })
afterEach(async () => { await clearCollections() })

const TX_URL = '/api/transactions'

const validTxBody = {
  amount: 250.50,
  type: 'income',
  category: 'Salary',
  date: '2024-01-15',
  notes: 'Monthly salary',
}

describe('POST /api/transactions', () => {
  it('analyst can create a transaction', async () => {
    const { token } = await createAnalyst()

    const res = await request(app)
      .post(TX_URL)
      .set('Authorization', `Bearer ${token}`)
      .send(validTxBody)

    expect(res.status).toBe(201)
    expect(res.body.data.amount).toBe(250.5)
    expect(res.body.data.type).toBe('income')
    expect(res.body.data.category).toBe('Salary')
  })

  it('admin can create a transaction', async () => {
    const { token } = await createAdmin()

    const res = await request(app)
      .post(TX_URL)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validTxBody, type: 'expense', category: 'Rent' })

    expect(res.status).toBe(201)
    expect(res.body.data.type).toBe('expense')
  })

  it('viewer cannot create a transaction (403)', async () => {
    const { token } = await createViewer()

    const res = await request(app)
      .post(TX_URL)
      .set('Authorization', `Bearer ${token}`)
      .send(validTxBody)

    expect(res.status).toBe(403)
  })

  it('returns 400 for negative amount', async () => {
    const { token } = await createAnalyst()

    const res = await request(app)
      .post(TX_URL)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validTxBody, amount: -100 })

    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid type', async () => {
    const { token } = await createAnalyst()

    const res = await request(app)
      .post(TX_URL)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validTxBody, type: 'transfer' })

    expect(res.status).toBe(400)
  })

  it('returns 400 when required fields are missing', async () => {
    const { token } = await createAnalyst()

    const res = await request(app)
      .post(TX_URL)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 100 }) // missing type, category, date

    expect(res.status).toBe(400)
  })

  it('returns 401 without auth token', async () => {
    const res = await request(app).post(TX_URL).send(validTxBody)
    expect(res.status).toBe(401)
  })
})

describe('GET /api/transactions', () => {
  beforeEach(async () => {
    const { user: admin } = await createAdmin()
    const id = admin._id.toString()
    await createTransaction(id, { type: 'income', category: 'Salary', amount: 5000 })
    await createTransaction(id, { type: 'expense', category: 'Rent', amount: 1500 })
    await createTransaction(id, { type: 'income', category: 'Freelance', amount: 800 })
  })

  it('viewer can list transactions', async () => {
    const { token } = await createViewer()
    const res = await request(app).get(TX_URL).set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.transactions).toBeInstanceOf(Array)
    expect(res.body.data.transactions.length).toBe(3)
  })

  it('filters by type=income', async () => {
    const { token } = await createViewer()
    const res = await request(app)
      .get(`${TX_URL}?type=income`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.transactions.every((t: { type: string }) => t.type === 'income')).toBe(true)
    expect(res.body.data.transactions.length).toBe(2)
  })

  it('filters by type=expense', async () => {
    const { token } = await createViewer()
    const res = await request(app)
      .get(`${TX_URL}?type=expense`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.transactions.length).toBe(1)
    expect(res.body.data.transactions[0].category).toBe('Rent')
  })

  it('filters by category (partial, case-insensitive)', async () => {
    const { token } = await createViewer()
    const res = await request(app)
      .get(`${TX_URL}?category=sal`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.transactions.length).toBe(1)
    expect(res.body.data.transactions[0].category).toBe('Salary')
  })

  it('returns paginated results', async () => {
    const { token } = await createViewer()
    const res = await request(app)
      .get(`${TX_URL}?page=1&limit=2`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.transactions.length).toBe(2)
    expect(res.body.data.page).toBe(1)
    expect(res.body.data.totalPages).toBeGreaterThanOrEqual(2)
  })

  it('excludes soft-deleted transactions', async () => {
    const { user: admin } = await createAdmin()
    await createTransaction(admin._id.toString(), { isDeleted: true, category: 'Hidden' })

    const { token } = await createViewer()
    const res = await request(app).get(TX_URL).set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    const categories = res.body.data.transactions.map((t: { category: string }) => t.category)
    expect(categories).not.toContain('Hidden')
  })

  it('returns 401 without auth', async () => {
    const res = await request(app).get(TX_URL)
    expect(res.status).toBe(401)
  })
})

describe('GET /api/transactions/:id', () => {
  it('returns a specific transaction by id', async () => {
    const { user, token } = await createAnalyst()
    const tx = await createTransaction(user._id.toString())

    const res = await request(app)
      .get(`${TX_URL}/${tx._id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data._id).toBe(tx._id.toString())
  })

  it('returns 404 for non-existent id', async () => {
    const { token } = await createViewer()
    const res = await request(app)
      .get(`${TX_URL}/64a1f1f1f1f1f1f1f1f1f1f1`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid ObjectId', async () => {
    const { token } = await createViewer()
    const res = await request(app)
      .get(`${TX_URL}/invalid-id`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(400)
  })

  it('returns 404 for soft-deleted transaction', async () => {
    const { user, token } = await createAdmin()
    const tx = await createTransaction(user._id.toString(), { isDeleted: true })

    const res = await request(app)
      .get(`${TX_URL}/${tx._id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/transactions/:id', () => {
  it('analyst can update a transaction', async () => {
    const { user, token } = await createAnalyst()
    const tx = await createTransaction(user._id.toString())

    const res = await request(app)
      .patch(`${TX_URL}/${tx._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 999.99, category: 'Updated' })

    expect(res.status).toBe(200)
    expect(res.body.data.amount).toBe(999.99)
    expect(res.body.data.category).toBe('Updated')
  })

  it('viewer cannot update a transaction (403)', async () => {
    const { user: admin } = await createAdmin()
    const tx = await createTransaction(admin._id.toString())
    const { token } = await createViewer()

    const res = await request(app)
      .patch(`${TX_URL}/${tx._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 1 })

    expect(res.status).toBe(403)
  })

  it('returns 400 when no fields provided', async () => {
    const { user, token } = await createAnalyst()
    const tx = await createTransaction(user._id.toString())

    const res = await request(app)
      .patch(`${TX_URL}/${tx._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({})

    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/transactions/:id', () => {
  it('admin can soft-delete a transaction', async () => {
    const { user, token } = await createAdmin()
    const tx = await createTransaction(user._id.toString())

    const res = await request(app)
      .delete(`${TX_URL}/${tx._id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)

    // Confirm it's no longer accessible
    const getRes = await request(app)
      .get(`${TX_URL}/${tx._id}`)
      .set('Authorization', `Bearer ${token}`)
    expect(getRes.status).toBe(404)
  })

  it('analyst cannot delete a transaction (403)', async () => {
    const { user: admin } = await createAdmin()
    const tx = await createTransaction(admin._id.toString())
    const { token } = await createAnalyst()

    const res = await request(app)
      .delete(`${TX_URL}/${tx._id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })

  it('viewer cannot delete a transaction (403)', async () => {
    const { user: admin } = await createAdmin()
    const tx = await createTransaction(admin._id.toString())
    const { token } = await createViewer()

    const res = await request(app)
      .delete(`${TX_URL}/${tx._id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })
})
