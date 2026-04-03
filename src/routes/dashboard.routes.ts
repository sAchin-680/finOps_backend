import { Router } from 'express'
import authenticate from '../middlewares/authenticate'
import { getSummary } from '../controllers/dashboard.controller'

const router = Router()

// All roles can view the dashboard
router.get('/summary', authenticate, getSummary)

export default router
