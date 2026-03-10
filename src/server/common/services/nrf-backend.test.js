import { describe, it, expect, vi } from 'vitest'
import Wreck from '@hapi/wreck'
import { getTraceId } from '@defra/hapi-tracing'
import { postRequestToBackend } from './nrf-backend.js'

vi.mock('@hapi/wreck')

const mockLogger = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn()
}))

vi.mock('../helpers/logging/logger.js', () => ({
  createLogger: () => mockLogger
}))

vi.mock('@defra/hapi-tracing', () => ({
  getTraceId: vi.fn()
}))

describe('nrf-backend service', () => {
  describe('postRequestToBackend', () => {
    it('should call the correct URL with payload and return the response', async () => {
      const mockResponse = { payload: { id: '123', status: 'ok' } }
      vi.mocked(Wreck.post).mockResolvedValue(mockResponse)
      vi.mocked(getTraceId).mockReturnValue(null)

      const result = await postRequestToBackend({
        endpointPath: '/quotes',
        payload: { foo: 'bar' }
      })

      expect(Wreck.post).toHaveBeenCalledWith('http://localhost:3001/quotes', {
        payload: { foo: 'bar' },
        json: true,
        headers: {}
      })
      expect(result).toBe(mockResponse)
    })

    it('should include the tracing header when a trace ID is present', async () => {
      vi.mocked(Wreck.post).mockResolvedValue({ payload: {} })
      vi.mocked(getTraceId).mockReturnValue('trace-abc-123')

      await postRequestToBackend({
        endpointPath: '/quotes',
        payload: { foo: 'bar' }
      })

      expect(Wreck.post).toHaveBeenCalledWith('http://localhost:3001/quotes', {
        payload: { foo: 'bar' },
        json: true,
        headers: { 'x-cdp-request-id': 'trace-abc-123' }
      })
    })

    it('should not include the tracing header when no trace ID is present', async () => {
      vi.mocked(Wreck.post).mockResolvedValue({ payload: {} })
      vi.mocked(getTraceId).mockReturnValue(undefined)

      await postRequestToBackend({
        endpointPath: '/quotes',
        payload: {}
      })

      const callArgs = vi.mocked(Wreck.post).mock.calls[0][1]
      expect(callArgs.headers).toEqual({})
    })

    it('should log and rethrow errors when the request fails', async () => {
      const error = new Error('Network error')
      vi.mocked(Wreck.post).mockRejectedValue(error)
      vi.mocked(getTraceId).mockReturnValue(null)

      await expect(
        postRequestToBackend({ endpointPath: '/quotes', payload: {} })
      ).rejects.toThrow('Network error')

      expect(mockLogger.error).toHaveBeenCalledWith(error)
    })
  })
})
