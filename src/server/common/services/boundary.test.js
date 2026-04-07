import { describe, it, expect, vi } from 'vitest'
import { postRequestToBackend } from './nrf-backend.js'
import { checkBoundary } from './boundary.js'

vi.mock('./nrf-backend.js')

const mockLogger = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn()
}))

vi.mock('../helpers/logging/logger.js', () => ({
  createLogger: () => mockLogger
}))

describe('boundary service', () => {
  describe('checkBoundary', () => {
    it('should return geojson on a successful response', async () => {
      const mockGeojson = {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: { type: 'Polygon' } }]
      }

      vi.mocked(postRequestToBackend).mockResolvedValue({
        res: { statusCode: 200 },
        payload: mockGeojson
      })

      const result = await checkBoundary('upload-123')

      expect(postRequestToBackend).toHaveBeenCalledWith({
        endpointPath: '/boundary/check/upload-123'
      })
      expect(result).toEqual({ geojson: mockGeojson })
    })

    it('should return error and geojson from payload when status >= 400', async () => {
      const payload = { error: 'Unsupported file format' }
      vi.mocked(postRequestToBackend).mockResolvedValue({
        res: { statusCode: 400 },
        payload
      })

      const result = await checkBoundary('upload-123')

      expect(result).toEqual({
        error: 'Unsupported file format',
        geojson: payload
      })
    })

    it('should return a default error message and geojson when status >= 400 and no error in payload', async () => {
      const payload = {}
      vi.mocked(postRequestToBackend).mockResolvedValue({
        res: { statusCode: 502 },
        payload
      })

      const result = await checkBoundary('upload-123')

      expect(result).toEqual({
        error: 'Boundary check failed (502)',
        geojson: payload
      })
    })

    it('should return error when request throws with no payload', async () => {
      vi.mocked(postRequestToBackend).mockRejectedValue(
        new Error('ECONNREFUSED')
      )

      const result = await checkBoundary('upload-123')

      expect(result).toEqual({ error: 'Unable to check boundary' })
    })

    it('should return backend error message and geojson when request throws with error and boundaryGeometryWgs84 in payload', async () => {
      const mockGeometry = {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: { type: 'Polygon' } }]
      }
      const responsePayload = {
        error:
          'The uploaded boundary contains invalid geometry (self-intersecting or overlapping lines). Please correct the file and try again.',
        boundaryGeometryWgs84: mockGeometry
      }
      const error = new Error('Bad Request')
      error.output = { statusCode: 400 }
      error.data = { payload: responsePayload }
      vi.mocked(postRequestToBackend).mockRejectedValue(error)

      const result = await checkBoundary('upload-123')

      expect(result).toEqual({
        error:
          'The uploaded boundary contains invalid geometry (self-intersecting or overlapping lines). Please correct the file and try again.',
        geojson: responsePayload
      })
    })

    it('should log error details when request throws with output info', async () => {
      const error = new Error('Bad Request')
      error.output = { statusCode: 400 }
      error.data = { payload: { detail: 'invalid geometry' } }
      vi.mocked(postRequestToBackend).mockRejectedValue(error)

      await checkBoundary('upload-123')

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('statusCode: 400')
      )
    })

    it('should return a user-friendly message when status is 413', async () => {
      const payload = { error: 'HTTP 413' }
      vi.mocked(postRequestToBackend).mockResolvedValue({
        res: { statusCode: 413 },
        payload
      })

      const result = await checkBoundary('upload-123')

      expect(result).toEqual({
        error:
          'The uploaded file is too large. The maximum file size allowed is 2MB.',
        geojson: payload
      })
    })

    it('should return a user-friendly message when error contains 413', async () => {
      vi.mocked(postRequestToBackend).mockResolvedValue({
        res: { statusCode: 400 },
        payload: { error: 'HTTP 413' }
      })

      const result = await checkBoundary('upload-123')

      expect(result).toEqual({
        error:
          'The uploaded file is too large. The maximum file size allowed is 2MB.',
        geojson: { error: 'HTTP 413' }
      })
    })

    it('should return a user-friendly message when thrown error is 413', async () => {
      const error = new Error('Payload Too Large')
      error.output = { statusCode: 413 }
      error.data = { payload: { error: 'Payload too large' } }
      vi.mocked(postRequestToBackend).mockRejectedValue(error)

      const result = await checkBoundary('upload-123')

      expect(result).toEqual({
        error:
          'The uploaded file is too large. The maximum file size allowed is 2MB.',
        geojson: { error: 'Payload too large' }
      })
    })
  })
})
