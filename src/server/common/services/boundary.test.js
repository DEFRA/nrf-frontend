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

    it('should return error from payload when status >= 400', async () => {
      vi.mocked(postRequestToBackend).mockResolvedValue({
        res: { statusCode: 400 },
        payload: { error: 'Unsupported file format' }
      })

      const result = await checkBoundary('upload-123')

      expect(result).toEqual({ error: 'Unsupported file format' })
    })

    it('should return a default error message when status >= 400 and no error in payload', async () => {
      vi.mocked(postRequestToBackend).mockResolvedValue({
        res: { statusCode: 502 },
        payload: {}
      })

      const result = await checkBoundary('upload-123')

      expect(result).toEqual({ error: 'Boundary check failed (502)' })
    })

    it('should return error when request throws', async () => {
      vi.mocked(postRequestToBackend).mockRejectedValue(
        new Error('ECONNREFUSED')
      )

      const result = await checkBoundary('upload-123')

      expect(result).toEqual({ error: 'Unable to check boundary' })
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
  })
})
