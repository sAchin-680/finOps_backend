import { ApiError } from '../../utils/ApiError'

describe('ApiError', () => {
  it('constructs with correct statusCode and message', () => {
    const err = new ApiError(418, "I'm a teapot")
    expect(err.statusCode).toBe(418)
    expect(err.message).toBe("I'm a teapot")
    expect(err.isOperational).toBe(true)
    expect(err).toBeInstanceOf(Error)
  })

  describe('static factory methods', () => {
    it('badRequest returns 400', () => {
      const err = ApiError.badRequest('Invalid input')
      expect(err.statusCode).toBe(400)
      expect(err.message).toBe('Invalid input')
    })

    it('unauthorized returns 401 with default message', () => {
      const err = ApiError.unauthorized()
      expect(err.statusCode).toBe(401)
      expect(err.message).toBe('Unauthorized')
    })

    it('unauthorized returns 401 with custom message', () => {
      const err = ApiError.unauthorized('Token expired')
      expect(err.statusCode).toBe(401)
      expect(err.message).toBe('Token expired')
    })

    it('forbidden returns 403 with default message', () => {
      const err = ApiError.forbidden()
      expect(err.statusCode).toBe(403)
      expect(err.message).toBe('Access denied')
    })

    it('forbidden returns 403 with custom message', () => {
      const err = ApiError.forbidden('Insufficient role')
      expect(err.statusCode).toBe(403)
      expect(err.message).toBe('Insufficient role')
    })

    it('notFound returns 404 with default message', () => {
      const err = ApiError.notFound()
      expect(err.statusCode).toBe(404)
      expect(err.message).toBe('Resource not found')
    })

    it('notFound returns 404 with custom message', () => {
      const err = ApiError.notFound('User not found')
      expect(err.statusCode).toBe(404)
      expect(err.message).toBe('User not found')
    })

    it('conflict returns 409', () => {
      const err = ApiError.conflict('Email already registered')
      expect(err.statusCode).toBe(409)
      expect(err.message).toBe('Email already registered')
    })
  })

  it('isOperational is always true', () => {
    const errors = [
      ApiError.badRequest('x'),
      ApiError.unauthorized(),
      ApiError.forbidden(),
      ApiError.notFound(),
      ApiError.conflict('x'),
    ]
    errors.forEach((err) => expect(err.isOperational).toBe(true))
  })

  it('captures a stack trace', () => {
    const err = ApiError.badRequest('test')
    expect(err.stack).toBeDefined()
    expect(err.stack).toContain('ApiError')
  })
})
