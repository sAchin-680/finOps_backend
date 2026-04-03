import express, { Request, Response } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import pinoHttp from 'pino-http'
import swaggerUi from 'swagger-ui-express'

import logger from './utils/logger'
import errorHandler from './middlewares/errorHandler'
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/user.routes'
import transactionRoutes from './routes/transaction.routes'
import dashboardRoutes from './routes/dashboard.routes'
import { swaggerSpec } from './config/swagger'

const app = express()

// ── Security headers
app.use(helmet())

// ── CORS
app.use(cors())

// ── Rate limiting — 100 requests per 15 minutes per IP
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
  })
)

// ── Request logging (structured JSON via Pino)
app.use(pinoHttp({ logger }))

// ── Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Health check
app.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'FinOps Backend API is running' })
})

app.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, status: 'healthy' })
})

// ── API docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }))
app.get('/api/docs.json', (_req: Request, res: Response) => res.json(swaggerSpec))

// ── API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/dashboard', dashboardRoutes)

// ── 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// ── Central error handler (must be last)
app.use(errorHandler)

export default app
