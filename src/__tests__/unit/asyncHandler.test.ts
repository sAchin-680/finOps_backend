import { Request, Response, NextFunction } from 'express'
import asyncHandler from '../../utils/asyncHandler'
import { ApiError } from '../../utils/ApiError'

const mockReq = {} as Request
const mockRes = {} as Response
const mockNext = jest.fn() as jest.MockedFunction<NextFunction>

beforeEach(() => {
  mockNext.mockClear()
})

describe('asyncHandler', () => {
  it('calls the handler and does not invoke next on success', async () => {
    const handler = asyncHandler(async (_req, _res, _next) => {
      // no error thrown
    })

    await handler(mockReq, mockRes, mockNext)
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('forwards thrown errors to next()', async () => {
    const error = ApiError.badRequest('Boom')
    const handler = asyncHandler(async () => {
      throw error
    })

    await handler(mockReq, mockRes, mockNext)
    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(mockNext).toHaveBeenCalledWith(error)
  })

  it('forwards non-ApiError errors to next()', async () => {
    const error = new Error('Unexpected failure')
    const handler = asyncHandler(async () => {
      throw error
    })

    await handler(mockReq, mockRes, mockNext)
    expect(mockNext).toHaveBeenCalledWith(error)
  })

  it('forwards errors thrown asynchronously after an await', async () => {
    const err = new TypeError('async type mismatch')
    const handler = asyncHandler(async () => {
      await Promise.resolve() // simulate an async step
      throw err
    })

    await handler(mockReq, mockRes, mockNext)
    // Allow microtasks to settle
    await Promise.resolve()
    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(mockNext).toHaveBeenCalledWith(err)
  })
})
