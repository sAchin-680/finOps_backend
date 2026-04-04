# FinOps Backend

A **Finance Data Processing and Access Control** REST API built with **Node.js, TypeScript, Express, and MongoDB**.

---

## Tech Stack

| Layer      | Tool                               |
| ---------- | ---------------------------------- |
| Runtime    | Node.js 20 LTS                     |
| Language   | TypeScript 5                       |
| Framework  | Express.js 4                       |
| Database   | MongoDB + Mongoose 8               |
| Validation | Zod 3                              |
| Auth       | JWT (jsonwebtoken) + bcryptjs      |
| Logging    | Pino + pino-http                   |
| Security   | Helmet + CORS + express-rate-limit |
| Testing    | Jest + ts-jest + Supertest + MongoDB Memory Server |
| API Docs   | Swagger UI (OpenAPI 3.0)           |

---

## Project Structure

```
src/
├── __tests__/
│   ├── envSetup.ts           # Sets env vars before module loading (Jest setupFiles)
│   ├── dbHelper.ts           # MongoMemoryServer connect/disconnect/clear helpers
│   ├── testFactories.ts      # User + transaction factory helpers for test setup
│   ├── auth.test.ts          # Integration tests — auth routes
│   ├── users.test.ts         # Integration tests — user routes
│   ├── transactions.test.ts  # Integration tests — transaction routes
│   ├── dashboard.test.ts     # Integration tests — dashboard routes
│   └── unit/
│       ├── ApiError.test.ts       # Unit tests — ApiError class
│       └── asyncHandler.test.ts   # Unit tests — asyncHandler wrapper
├── config/
│   ├── db.ts                 # Mongoose connection
│   ├── env.ts                # Zod-validated environment variables
│   └── swagger.ts            # OpenAPI 3.0 specification
├── models/
│   ├── User.ts               # User schema with role enum
│   └── Transaction.ts        # Transaction schema with soft delete
├── middlewares/
│   ├── authenticate.ts       # JWT verification → req.user
│   ├── authorize.ts          # Role guard factory
│   ├── validate.ts           # Zod schema validation middleware
│   └── errorHandler.ts       # Central error handler
├── validators/
│   ├── auth.validator.ts
│   ├── user.validator.ts
│   └── transaction.validator.ts
├── services/                 # All business logic (no req/res here)
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── transaction.service.ts
│   └── dashboard.service.ts
├── controllers/              # Handles req/res, calls services
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   ├── transaction.controller.ts
│   └── dashboard.controller.ts
├── routes/
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   ├── transaction.routes.ts
│   └── dashboard.routes.ts
├── types/
│   └── express.d.ts          # Extends Request with req.user
├── utils/
│   ├── ApiError.ts           # Custom operational error class
│   ├── asyncHandler.ts       # Wraps async controllers (no try/catch needed)
│   └── logger.ts             # Pino logger instance
├── app.ts                    # Express app setup and middleware chain
└── server.ts                 # Entry point: DB connect → listen
```

---

## Setup and Installation

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone and install

```bash
cd finops_backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/finops
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
```

### 3. Seed the database

```bash
npm run seed
```

This creates 3 default users and 18 sample transactions.

| Role    | Username        | Password     |
| ------- | --------------- | ------------ |
| Admin   | `admin`         | `Admin@1234` |
| Analyst | `alice_analyst` | `Alice@1234` |
| Viewer  | `bob_viewer`    | `Bob@12345`  |

### 4. Run in development

```bash
npm run dev
```

### 5. Run tests

```bash
npm test                # run all tests (78 tests across 6 suites)
npm run test:watch      # watch mode
npm run test:coverage   # with coverage report
```

Tests use an in-memory MongoDB instance — no external DB needed.

### 6. Build for production

```bash
npm run build
npm start
```

---

## API Documentation (Swagger)

Interactive API docs are available at:

| Endpoint | Description |
|---|---|
| `GET /api/docs` | Swagger UI — try endpoints in the browser |
| `GET /api/docs.json` | Raw OpenAPI 3.0 JSON spec (import into Postman/Insomnia) |

The spec documents all 16 endpoints with request schemas, response shapes, role requirements, and example values.

---

## Deployment

This project is deployed on Render at: https://finops-backend-rjlc.onrender.com

- Live Swagger UI: https://finops-backend-rjlc.onrender.com/api/docs
- OpenAPI JSON: https://finops-backend-rjlc.onrender.com/api/docs.json

---

## API Reference

### Base URL

```
http://localhost:5000/api
```

All protected routes require:

```
Authorization: Bearer <token>
```

---

### Auth `/api/auth`

| Method | Endpoint         | Access | Description                      |
| ------ | ---------------- | ------ | -------------------------------- |
| POST   | `/auth/register` | Public | Register (always creates viewer) |
| POST   | `/auth/login`    | Public | Login, returns JWT token         |

**Register**

```json
POST /api/auth/register
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Secret@123"
}
```

**Login**

```json
POST /api/auth/login
{
  "username": "admin",
  "password": "Admin@1234"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "user": { "id": "...", "username": "admin", "role": "admin" }
  }
}
```

---

### Users `/api/users`

| Method | Endpoint     | Access   | Description                  |
| ------ | ------------ | -------- | ---------------------------- |
| GET    | `/users/me`  | Any role | Get own profile              |
| GET    | `/users`     | Admin    | List all users (paginated)   |
| POST   | `/users`     | Admin    | Create user with any role    |
| GET    | `/users/:id` | Admin    | Get user by ID               |
| PATCH  | `/users/:id` | Admin    | Update role / email / status |
| DELETE | `/users/:id` | Admin    | Delete a user                |

**Query params for GET /users:**

- `page` (default: 1)
- `limit` (default: 20, max: 100)

---

### Transactions `/api/transactions`

| Method | Endpoint            | Access         | Description                              |
| ------ | ------------------- | -------------- | ---------------------------------------- |
| GET    | `/transactions`     | All roles      | List transactions (paginated + filtered) |
| GET    | `/transactions/:id` | All roles      | Get transaction by ID                    |
| POST   | `/transactions`     | Analyst, Admin | Create transaction                       |
| PATCH  | `/transactions/:id` | Analyst, Admin | Update transaction                       |
| DELETE | `/transactions/:id` | Admin          | Soft delete transaction                  |

**Query params for GET /transactions:**
| Param | Type | Description |
|---|---|---|
| `type` | `income` or `expense` | Filter by type |
| `category` | string | Partial match (case-insensitive) |
| `dateFrom` | ISO date | Filter from date |
| `dateTo` | ISO date | Filter to date |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20, max: 100) |

**Create Transaction**

```json
POST /api/transactions
{
  "amount": 1500.00,
  "type": "income",
  "category": "Freelance",
  "date": "2026-04-01T00:00:00.000Z",
  "notes": "Website project payment"
}
```

---

### Dashboard `/api/dashboard`

| Method | Endpoint             | Access    | Description                  |
| ------ | -------------------- | --------- | ---------------------------- |
| GET    | `/dashboard/summary` | All roles | Aggregated financial summary |

**Response:**

```json
{
  "success": true,
  "data": {
    "totalIncome": 11900.00,
    "totalExpense": 5707.50,
    "netBalance": 6192.50,
    "transactionCount": 18,
    "categoryTotals": [
      { "category": "Salary", "total": 10000.00, "count": 2 }
    ],
    "recentTransactions": [...],
    "monthlyTrends": [
      { "year": 2026, "month": 2, "income": 6500, "expense": 1865.50, "net": 4634.50 }
    ]
  }
}
```

---

## Role Permissions

| Endpoint                 | Viewer | Analyst | Admin |
| ------------------------ | :----: | :-----: | :---: |
| POST /auth/register      |   ✅   |   ✅    |  ✅   |
| POST /auth/login         |   ✅   |   ✅    |  ✅   |
| GET /users/me            |   ✅   |   ✅    |  ✅   |
| GET /users               |   ❌   |   ❌    |  ✅   |
| POST /users              |   ❌   |   ❌    |  ✅   |
| PATCH /users/:id         |   ❌   |   ❌    |  ✅   |
| DELETE /users/:id        |   ❌   |   ❌    |  ✅   |
| GET /transactions        |   ✅   |   ✅    |  ✅   |
| GET /transactions/:id    |   ✅   |   ✅    |  ✅   |
| POST /transactions       |   ❌   |   ✅    |  ✅   |
| PATCH /transactions/:id  |   ❌   |   ✅    |  ✅   |
| DELETE /transactions/:id |   ❌   |   ❌    |  ✅   |
| GET /dashboard/summary   |   ✅   |   ✅    |  ✅   |

---

## Design Decisions & Assumptions

1. **Self-registration always creates a Viewer** — role assignment is an admin-only action via `POST /users` or `PATCH /users/:id`.

2. **Soft delete for transactions** — records are never physically removed (`isDeleted: true`). This preserves audit history which is critical in finance systems.

3. **Layered architecture** — `Route → Controller → Service → Model`. Services have zero HTTP knowledge (`req`/`res` never enters a service), making business logic easily testable.

4. **Zod for validation** — schemas are defined once and TypeScript types are inferred from them (`z.infer<typeof schema>`), eliminating duplication.

5. **Central error handler** — no `try/catch` in controllers. `asyncHandler` forwards errors to the single `errorHandler` middleware which handles `ApiError`, Mongoose errors, and unexpected crashes consistently.

6. **Password not returned** — Mongoose `select: false` on the password field ensures it is never included in any query result unless explicitly requested.

7. **Structured logging with Pino** — all logs are JSON-formatted for easy parsing in production log aggregators (e.g., Datadog, CloudWatch).

8. **Environment validation at startup** — `src/config/env.ts` validates all required env vars with Zod before the server starts. Missing or invalid config causes an immediate exit with a clear error message.

9. **Integration-first test strategy** — tests use Supertest against the real Express app and an in-memory MongoDB (no mocks). This catches middleware bugs, auth failures, and schema mismatches that unit tests with mocked DBs would miss. Each test suite spins up its own isolated MongoDB instance and clears collections between tests.

10. **OpenAPI 3.0 spec defined inline** — the Swagger spec lives in `src/config/swagger.ts` as a plain TypeScript object. This keeps it co-located with the app, type-checked by the compiler, and avoids scattering JSDoc annotations across every route file.
