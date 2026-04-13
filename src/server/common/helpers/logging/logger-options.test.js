import { getTraceId } from '@defra/hapi-tracing'

vi.mock('@defra/hapi-tracing', () => ({ getTraceId: vi.fn() }))

// Force ECS format so formatters.log is present on loggerOptions
vi.mock('../../../../config/config.js', () => ({
  config: {
    get: (key) => {
      const values = {
        log: { isEnabled: true, level: 'info', format: 'ecs', redact: [] },
        serviceName: 'test-service',
        serviceVersion: '1.0.0'
      }
      return values[key]
    }
  }
}))

const { loggerOptions } = await import('./logger-options.js')

// A second isolated import where ecsFormat returns no formatters.log,
// exercising the `: rest` and `: object` fallback branches (lines 22, 27)
vi.doMock('@elastic/ecs-pino-format', () => ({
  ecsFormat: () => ({ formatters: {} })
}))
vi.resetModules()
const { loggerOptions: loggerOptionsNoEcsLog } =
  await import('./logger-options.js')
vi.doUnmock('@elastic/ecs-pino-format')
vi.resetModules()

describe('#loggerOptions', () => {
  describe('mixin', () => {
    test('returns empty object when no trace ID is present', () => {
      getTraceId.mockReturnValue(null)

      expect(loggerOptions.mixin()).toEqual({})
    })

    test('returns trace ID when present', () => {
      getTraceId.mockReturnValue('abc-123')

      expect(loggerOptions.mixin()).toEqual({ trace: { id: 'abc-123' } })
    })
  })

  describe('getChildBindings', () => {
    test('returns url.path from request', () => {
      const mockRequest = { url: { pathname: '/some/path' } }

      expect(loggerOptions.getChildBindings(mockRequest)).toEqual({
        url: { path: '/some/path' }
      })
    })
  })

  describe('formatters.log', () => {
    test('passes through object with no err field, delegating to ECS formatter', () => {
      const input = { message: 'hello', level: 30 }

      const result = loggerOptions.formatters.log(input)

      expect(result.message).toBe('hello')
      expect(result).not.toHaveProperty('err')
    })

    test('strips err and merges ECS error fields when err is an Error', () => {
      const error = new Error('something broke')
      const input = { err: error, message: 'oh no' }

      const result = loggerOptions.formatters.log(input)

      expect(result).not.toHaveProperty('err')
      expect(result.error.message).toBe('something broke')
      expect(result.error.type).toBe('Error')
      expect(result.error.stack_trace).toBe(error.stack)
    })

    test('includes http field when error has a status code', () => {
      const error = new Error('not found')
      error.statusCode = 404
      const input = { err: error }

      const result = loggerOptions.formatters.log(input)

      expect(result.http).toEqual({ response: { status_code: 404 } })
    })

    test('does not strip err when it is not an Error instance', () => {
      const input = { err: 'plain string error', message: 'hmm' }

      const result = loggerOptions.formatters.log(input)

      expect(result.err).toBe('plain string error')
    })

    test('returns object as-is when no ECS log formatter and no err', () => {
      const input = { message: 'hello' }

      const result = loggerOptionsNoEcsLog.formatters.log(input)

      expect(result).toEqual({ message: 'hello' })
    })

    test('returns structured error without ECS wrapping when no ECS log formatter', () => {
      const error = new Error('bare error')
      const input = { err: error, message: 'oh no' }

      const result = loggerOptionsNoEcsLog.formatters.log(input)

      expect(result).not.toHaveProperty('err')
      expect(result.error.message).toBe('bare error')
    })
  })
})
