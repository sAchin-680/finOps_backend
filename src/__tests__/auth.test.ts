import request from 'supertest'
import app from '../app'
import { connectTestDb, disconnectTestDb, clearCollections } from './dbHelper'
import { createUserWithToken } from './testFactories'

beforeAll(async () => { await connectTestDb() })
afterAll(async () => { await disconnectTestDb() })
afterEach(async () => { await clearCollections() })

const REGISTER_URL = '/api/auth/register'
const LOGIN_URL = '/api/auth/login'

describe('POST /api/auth/register', () => {
  const validPayload = {
    username: 'alice_test',
    email: 'alice@test.com',
    password: 'Password123',
  }

  it('creates a new user and returns 201 with token', async () => {
    const res = await request(app).post(REGISTER_URL).send(validPayload)

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.token).toBeDefined()
    expect(res.body.data.user.username).toBe('alice_test')
    expect(res.body.data.user.role).toBe('viewer') // always viewer on self-registration
    expect(res.body.data.user.password).toBeUndefined() // never exposed
  })

  it('returns 409 when username is already taken', async () => {
    await request(app).post(REGISTER_URL).send(validPayload)
    const res = await request(app).post(REGISTER_URL).send(validPayload)

    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toMatch(/username/i)
  })

  it('returns 409 when email is already registered', async () => {
    await request(app).post(REGISTER_URL).send(validPayload)
    const res = await request(app)
      .post(REGISTER_URL)
      .send({ ...validPayload, username: 'different_user' })

    expect(res.status).toBe(409)
    expect(res.body.message).toMatch(/email/i)
  })

  it('returns 400 for missing required fields', async () => {
    const res = await request(app).post(REGISTER_URL).send({ username: 'alice_test' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 400 for invalid email format', async () => {
    const res = await request(app)
      .post(REGISTER_URL)
      .send({ ...validPayload, email: 'not-an-email' })

    expect(res.status).toBe(400)
  })

  it('returns 400 when password is shorter than 8 characters', async () => {
    const res = await request(app)
      .post(REGISTER_URL)
      .send({ ...validPayload, password: 'short' })

    expect(res.status).toBe(400)
  })

  it('returns 400 for username with special characters', async () => {
    const res = await request(app)
      .post(REGISTER_URL)
      .send({ ...validPayload, username: 'bad user!' })

    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post(REGISTER_URL).send({
      username: 'login_user',
      email: 'login@test.com',
      password: 'Password123',
    })
  })

  it('returns 200 with token for valid credentials', async () => {
    const res = await request(app)
      .post(LOGIN_URL)
      .send({ username: 'login_user', password: 'Password123' })

    expect(res.status).toBe(200)
    expect(res.body.data.token).toBeDefined()
    expect(res.body.data.user.username).toBe('login_user')
  })

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post(LOGIN_URL)
      .send({ username: 'login_user', password: 'WrongPassword!' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('returns 401 for non-existent username', async () => {
    const res = await request(app)
      .post(LOGIN_URL)
      .send({ username: 'ghost_user', password: 'Password123' })

    expect(res.status).toBe(401)
  })

  it('returns 403 when account is deactivated', async () => {
    const { user } = await createUserWithToken({ isActive: false })
    const res = await request(app)
      .post(LOGIN_URL)
      .send({ username: user.username, password: 'Password123' })

    expect(res.status).toBe(403)
    expect(res.body.message).toMatch(/deactivated/i)
  })

  it('returns 400 for missing fields', async () => {
    const res = await request(app).post(LOGIN_URL).send({ username: 'login_user' })

    expect(res.status).toBe(400)
  })
})
