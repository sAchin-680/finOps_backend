import request from 'supertest'
import app from '../app'
import { connectTestDb, disconnectTestDb, clearCollections } from './dbHelper'
import { createAdmin, createAnalyst, createViewer } from './testFactories'

beforeAll(async () => { await connectTestDb() })
afterAll(async () => { await disconnectTestDb() })
afterEach(async () => { await clearCollections() })

describe('GET /api/users/me', () => {
  it('returns own profile for authenticated user', async () => {
    const { token, user } = await createViewer()
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.username).toBe(user.username)
    expect(res.body.data.password).toBeUndefined()
  })

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/users/me')
    expect(res.status).toBe(401)
  })

  it('returns 401 with malformed token', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer not.a.real.token')

    expect(res.status).toBe(401)
  })
})

describe('GET /api/users', () => {
  it('returns paginated user list for admin', async () => {
    const { token } = await createAdmin()
    await createViewer()
    await createAnalyst()

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.users).toBeInstanceOf(Array)
    expect(res.body.data.total).toBeGreaterThanOrEqual(3)
    expect(res.body.data.page).toBe(1)
    expect(res.body.data.totalPages).toBeDefined()
  })

  it('returns 403 for viewer', async () => {
    const { token } = await createViewer()
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })

  it('returns 403 for analyst', async () => {
    const { token } = await createAnalyst()
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })

  it('respects pagination params', async () => {
    const { token } = await createAdmin()

    const res = await request(app)
      .get('/api/users?page=1&limit=1')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.users.length).toBe(1)
    expect(res.body.data.page).toBe(1)
  })
})

describe('POST /api/users', () => {
  it('admin can create a user with any role', async () => {
    const { token } = await createAdmin()

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'new_analyst',
        email: 'newanalyst@test.com',
        password: 'Password123',
        role: 'analyst',
      })

    expect(res.status).toBe(201)
    expect(res.body.data.role).toBe('analyst')
    expect(res.body.data.password).toBeUndefined()
  })

  it('returns 403 for non-admin', async () => {
    const { token } = await createViewer()

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'hacker',
        email: 'hacker@test.com',
        password: 'Password123',
        role: 'admin',
      })

    expect(res.status).toBe(403)
  })

  it('returns 409 for duplicate username', async () => {
    const { token } = await createAdmin()
    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'dupuser', email: 'dup1@test.com', password: 'Password123', role: 'viewer' })

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'dupuser', email: 'dup2@test.com', password: 'Password123', role: 'viewer' })

    expect(res.status).toBe(409)
  })

  it('returns 400 for invalid role', async () => {
    const { token } = await createAdmin()

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'someone', email: 'someone@test.com', password: 'Password123', role: 'superadmin' })

    expect(res.status).toBe(400)
  })
})

describe('GET /api/users/:id', () => {
  it('admin can fetch any user by id', async () => {
    const { token } = await createAdmin()
    const { user: target } = await createViewer()

    const res = await request(app)
      .get(`/api/users/${target._id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data._id).toBe(target._id.toString())
  })

  it('returns 404 for non-existent id', async () => {
    const { token } = await createAdmin()
    const fakeId = '64a1f1f1f1f1f1f1f1f1f1f1'

    const res = await request(app)
      .get(`/api/users/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid ObjectId format', async () => {
    const { token } = await createAdmin()

    const res = await request(app)
      .get('/api/users/not-a-valid-id')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/users/:id', () => {
  it('admin can update user role and status', async () => {
    const { token } = await createAdmin()
    const { user } = await createViewer()

    const res = await request(app)
      .patch(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'analyst', isActive: false })

    expect(res.status).toBe(200)
    expect(res.body.data.role).toBe('analyst')
    expect(res.body.data.isActive).toBe(false)
  })

  it('returns 400 when no fields are provided', async () => {
    const { token } = await createAdmin()
    const { user } = await createViewer()

    const res = await request(app)
      .patch(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({})

    expect(res.status).toBe(400)
  })

  it('prevents admin from deactivating own account', async () => {
    const { token, user } = await createAdmin()

    const res = await request(app)
      .patch(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isActive: false })

    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/own account/i)
  })
})

describe('DELETE /api/users/:id', () => {
  it('admin can delete a user', async () => {
    const { token } = await createAdmin()
    const { user } = await createViewer()

    const res = await request(app)
      .delete(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)

    // Confirm user is gone
    const getRes = await request(app)
      .get(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
    expect(getRes.status).toBe(404)
  })

  it('prevents admin from deleting their own account', async () => {
    const { token, user } = await createAdmin()

    const res = await request(app)
      .delete(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/own account/i)
  })

  it('returns 403 for non-admin', async () => {
    const { token } = await createAnalyst()
    const { user } = await createViewer()

    const res = await request(app)
      .delete(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })
})
