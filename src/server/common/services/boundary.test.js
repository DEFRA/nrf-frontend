import { describe, it, expect, vi } from 'vitest'
import Wreck from '@hapi/wreck'
import { config } from '../../../config/config.js'
import { checkBoundary } from './boundary.js'

vi.mock('@hapi/wreck')

const mockLogger = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn()
}))

vi.mock('../helpers/logging/logger.js', () => ({
  createLogger: () => mockLogger
}))

const backendUrl = config.get('backend').apiUrl

describe('boundary service', () => {
  describe('checkBoundary', () => {
    it('should return geojson on a successful response', async () => {
      const mockGeojson = {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: { type: 'Polygon' } }]
      }

      vi.mocked(Wreck.post).mockResolvedValue({
        res: { statusCode: 200 },
        payload: mockGeojson
      })

      const result = await checkBoundary('upload-123')

      expect(Wreck.post).toHaveBeenCalledWith(
        `${backendUrl}/boundary/check/upload-123`,
        { json: true }
      )
      expect(result).toEqual({ geojson: mockGeojson })
    })

    it('should return error from payload when status >= 400', async () => {
      vi.mocked(Wreck.post).mockResolvedValue({
        res: { statusCode: 400 },
        payload: { error: 'Unsupported file format' }
      })

      const result = await checkBoundary('upload-123')

      expect(result).toEqual({ error: 'Unsupported file format' })
    })

    it('should return a default error message when status >= 400 and no error in payload', async () => {
      vi.mocked(Wreck.post).mockResolvedValue({
        res: { statusCode: 502 },
        payload: {}
      })

      const result = await checkBoundary('upload-123')

      expect(result).toEqual({ error: 'Boundary check failed (502)' })
    })

    it('should return error when Wreck throws', async () => {
      vi.mocked(Wreck.post).mockRejectedValue(new Error('ECONNREFUSED'))

      const result = await checkBoundary('upload-123')

      expect(result).toEqual({ error: 'Unable to check boundary' })
    })

    it('should log error details when Wreck throws with output info', async () => {
      const error = new Error('Bad Request')
      error.output = { statusCode: 400 }
      error.data = { payload: { detail: 'invalid geometry' } }
      vi.mocked(Wreck.post).mockRejectedValue(error)

      await checkBoundary('upload-123')

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('statusCode: 400')
      )
    })
  })
})
