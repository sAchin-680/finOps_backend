import { Request, Response } from 'express'
import asyncHandler from '../utils/asyncHandler'
import * as dashboardService from '../services/dashboard.service'

// GET /dashboard/summary
export const getSummary = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await dashboardService.getDashboardSummary()
  res.status(200).json({ success: true, data: summary })
})
