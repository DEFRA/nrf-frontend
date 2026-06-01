import { describe, it, expect, vi } from 'vitest'
import Wreck from '@hapi/wreck'
import { config } from '../../../config/config.js'
import {
  getRequestFromBackend,
  getQuoteFromBackend,
  postRequestToBackend
} from './nrf-backend.js'

const backendUrl = config.get('backend').apiUrl

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
  withTraceId: vi.fn()
}))

import { withTraceId } from '@defra/hapi-tracing'

describe('nrf-backend service', () => {
  describe('getRequestFromBackend', () => {
    it('should call the correct URL and return the response', async () => {
      const mockResponse = { payload: { id: '123', status: 'ok' } }
      vi.mocked(Wreck.get).mockResolvedValue(mockResponse)
      vi.mocked(withTraceId).mockReturnValue({})

      const result = await getRequestFromBackend({
        endpointPath: '/quotes/123'
      })

      expect(Wreck.get).toHaveBeenCalledWith(`${backendUrl}/quotes/123`, {
        json: true,
        headers: {}
      })
      expect(result).toBe(mockResponse)
    })

    it('should include the tracing header when a trace ID is present', async () => {
      vi.mocked(Wreck.get).mockResolvedValue({ payload: {} })
      vi.mocked(withTraceId).mockReturnValue({
        'x-cdp-request-id': 'trace-abc-123'
      })

      await getRequestFromBackend({ endpointPath: '/quotes/123' })

      expect(Wreck.get).toHaveBeenCalledWith(`${backendUrl}/quotes/123`, {
        json: true,
        headers: { 'x-cdp-request-id': 'trace-abc-123' }
      })
    })

    it('should not include the tracing header when no trace ID is present', async () => {
      vi.mocked(Wreck.get).mockResolvedValue({ payload: {} })
      vi.mocked(withTraceId).mockReturnValue({})

      await getRequestFromBackend({ endpointPath: '/quotes/123' })

      const callArgs = vi.mocked(Wreck.get).mock.calls[0][1]
      expect(callArgs.headers).toEqual({})
    })

    it('should merge extra headers when provided', async () => {
      vi.mocked(Wreck.get).mockResolvedValue({ payload: {} })
      vi.mocked(withTraceId).mockReturnValue({})

      await getRequestFromBackend({
        endpointPath: '/quotes/123',
        headers: { Authorization: 'Bearer my-secret-token' }
      })

      expect(Wreck.get).toHaveBeenCalledWith(`${backendUrl}/quotes/123`, {
        json: true,
        headers: { Authorization: 'Bearer my-secret-token' }
      })
    })

    it('should not include extra headers when none are provided', async () => {
      vi.mocked(Wreck.get).mockResolvedValue({ payload: {} })
      vi.mocked(withTraceId).mockReturnValue({})

      await getRequestFromBackend({ endpointPath: '/quotes/123' })

      const callArgs = vi.mocked(Wreck.get).mock.calls[0][1]
      expect(callArgs.headers).not.toHaveProperty('Authorization')
    })

    it('should log and rethrow errors when the request fails', async () => {
      const error = new Error('Network error')
      vi.mocked(Wreck.get).mockRejectedValue(error)
      vi.mocked(withTraceId).mockReturnValue({})

      await expect(
        getRequestFromBackend({ endpointPath: '/quotes/123' })
      ).rejects.toThrow('Network error')

      expect(mockLogger.error).toHaveBeenCalledWith(
        error,
        'GET request to backend failed'
      )
    })
  })

  describe('getQuoteFromBackend', () => {
    it('should call getRequestFromBackend with the quote endpoint', async () => {
      vi.mocked(Wreck.get).mockResolvedValue({
        payload: { reference: 'NRF-123' }
      })
      vi.mocked(withTraceId).mockReturnValue({})

      await getQuoteFromBackend({ reference: 'NRF-123' })

      expect(Wreck.get).toHaveBeenCalledWith(
        `${backendUrl}/quotes/NRF-123`,
        expect.objectContaining({ json: true })
      )
    })

    it('should include Authorization header when bearerToken is provided', async () => {
      vi.mocked(Wreck.get).mockResolvedValue({ payload: {} })
      vi.mocked(withTraceId).mockReturnValue({})

      await getQuoteFromBackend({
        reference: 'NRF-123',
        bearerToken: 'my-secret-token'
      })

      expect(Wreck.get).toHaveBeenCalledWith(
        `${backendUrl}/quotes/NRF-123`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-secret-token'
          })
        })
      )
    })

    it('should not include Authorization header when bearerToken is not provided', async () => {
      vi.mocked(Wreck.get).mockResolvedValue({ payload: {} })
      vi.mocked(withTraceId).mockReturnValue({})

      await getQuoteFromBackend({ reference: 'NRF-123' })

      const callArgs = vi.mocked(Wreck.get).mock.calls[0][1]
      expect(callArgs.headers).not.toHaveProperty('Authorization')
    })
  })

  describe('postRequestToBackend', () => {
    it('should call the correct URL with payload and return the response', async () => {
      const mockResponse = { payload: { id: '123', status: 'ok' } }
      vi.mocked(Wreck.post).mockResolvedValue(mockResponse)
      vi.mocked(withTraceId).mockReturnValue({})

      const result = await postRequestToBackend({
        endpointPath: '/quotes',
        payload: { foo: 'bar' }
      })

      expect(Wreck.post).toHaveBeenCalledWith(`${backendUrl}/quotes`, {
        payload: { foo: 'bar' },
        json: true,
        headers: {}
      })
      expect(result).toBe(mockResponse)
    })

    it('should include the tracing header when a trace ID is present', async () => {
      vi.mocked(Wreck.post).mockResolvedValue({ payload: {} })
      vi.mocked(withTraceId).mockReturnValue({
        'x-cdp-request-id': 'trace-abc-123'
      })

      await postRequestToBackend({
        endpointPath: '/quotes',
        payload: { foo: 'bar' }
      })

      expect(Wreck.post).toHaveBeenCalledWith(`${backendUrl}/quotes`, {
        payload: { foo: 'bar' },
        json: true,
        headers: { 'x-cdp-request-id': 'trace-abc-123' }
      })
    })

    it('should not include the tracing header when no trace ID is present', async () => {
      vi.mocked(Wreck.post).mockResolvedValue({ payload: {} })
      vi.mocked(withTraceId).mockReturnValue({})

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
      vi.mocked(withTraceId).mockReturnValue({})

      await expect(
        postRequestToBackend({ endpointPath: '/quotes', payload: {} })
      ).rejects.toThrow('Network error')

      expect(mockLogger.error).toHaveBeenCalledWith(
        error,
        'POST request to backend failed'
      )
    })
  })
})
