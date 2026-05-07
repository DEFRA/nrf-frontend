import { describe, it, expect, beforeEach, vi } from 'vitest'
import { browserLogsController } from './controller.js'
import { statusCodes } from '../common/constants/status-codes.js'
import { config } from '../../config/config.js'
import {
  browserEvents,
  TEST_TIMESTAMP
} from '../../test-utils/fixtures/browser-logs.js'
import {
  createMockRequest,
  createMockResponseToolkit
} from '../../test-utils/create-mock-request.js'

vi.mock('../../config/config.js', () => ({
  config: {
    get: vi.fn()
  }
}))

const EXPECTED_TIMESTAMP = new Date(TEST_TIMESTAMP).toISOString()

describe('browserLogsController', () => {
  let mockRequest
  let mockH
  let mockResponse

  beforeEach(() => {
    mockRequest = createMockRequest()
    mockH = createMockResponseToolkit()
    mockResponse = mockH.mockResponse

    config.get.mockReturnValue(true)
  })

  describe('controller options', () => {
    it('disables CSRF protection for sendBeacon requests', () => {
      expect(browserLogsController.options.plugins.crumb).toBe(false)
    })
  })

  describe('handler - successful log processing', () => {
    it('logs error events in ECS format', () => {
      mockRequest.payload = browserEvents.error
      browserLogsController.handler(mockRequest, mockH)
      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          '@timestamp': EXPECTED_TIMESTAMP,
          message: 'Test error',
          log: { level: 'error', logger: 'browser' },
          event: { action: 'error' }
        }),
        'Test error'
      )
    })

    it('defaults to error level when level is not provided', () => {
      mockRequest.payload = browserEvents.errorWithoutLevel
      browserLogsController.handler(mockRequest, mockH)
      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ log: { level: 'error', logger: 'browser' } }),
        'Test error'
      )
    })

    it('returns 204 No Content', () => {
      mockRequest.payload = browserEvents.error
      browserLogsController.handler(mockRequest, mockH)
      expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.noContent)
    })

    it('logs warn level events', () => {
      mockRequest.payload = browserEvents.warn
      browserLogsController.handler(mockRequest, mockH)
      expect(mockRequest.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Warning message',
          log: { level: 'warn', logger: 'browser' }
        }),
        'Warning message'
      )
      expect(mockRequest.logger.error).not.toHaveBeenCalled()
    })

    it('logs info level events', () => {
      mockRequest.payload = browserEvents.info
      browserLogsController.handler(mockRequest, mockH)
      expect(mockRequest.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Info message',
          log: { level: 'info', logger: 'browser' }
        }),
        'Info message'
      )
      expect(mockRequest.logger.error).not.toHaveBeenCalled()
    })

    it('logs debug level events', () => {
      mockRequest.payload = browserEvents.debug
      browserLogsController.handler(mockRequest, mockH)
      expect(mockRequest.logger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Debug message',
          log: { level: 'debug', logger: 'browser' }
        }),
        'Debug message'
      )
      expect(mockRequest.logger.error).not.toHaveBeenCalled()
    })
  })

  describe('handler - error handling to prevent infinite loops', () => {
    it('silently handles errors and returns 204', () => {
      mockRequest.payload = null

      const result = browserLogsController.handler(mockRequest, mockH)

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        expect.any(Error),
        'Failed to process browser log'
      )
      expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.noContent)
      expect(result).toBe(mockResponse)
    })

    it('catches errors from unsupported log levels and returns 204', () => {
      mockRequest.payload = browserEvents.trace
      mockRequest.logger.trace = undefined

      const result = browserLogsController.handler(mockRequest, mockH)

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        expect.any(Error),
        'Failed to process browser log'
      )
      expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.noContent)
      expect(result).toBe(mockResponse)
    })

    it('does not throw so as not to trigger another browser log', () => {
      mockRequest.payload = null

      expect(() => {
        browserLogsController.handler(mockRequest, mockH)
      }).not.toThrow()
    })
  })

  describe('handler - browser logging disabled', () => {
    beforeEach(() => {
      config.get.mockReturnValue(false)
    })

    it('returns 404 without logging', () => {
      mockRequest.payload = browserEvents.error
      const result = browserLogsController.handler(mockRequest, mockH)

      expect(mockRequest.logger.error).not.toHaveBeenCalled()
      expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.notFound)
      expect(result).toBe(mockResponse)
    })
  })
})
