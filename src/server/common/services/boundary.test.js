import { describe, it, expect, vi } from 'vitest'
import { postRequestToBackend } from './nrf-backend.js'
import { checkBoundary, checkBoundaryGeometry } from './boundary.js'
import { BOUNDARY_ERRORS } from '@defra/nrf-library'

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

    it('should return failureReason and geojson from payload when status >= 400', async () => {
      const payload = { error: 'unsupported_file_type' }
      vi.mocked(postRequestToBackend).mockResolvedValue({
        res: { statusCode: 400 },
        payload
      })

      const result = await checkBoundary('upload-123')

      expect(result).toEqual({
        failureReason: 'unsupported_file_type',
        geojson: payload
      })
    })

    it('should fall back to boundary_check_failed when payload has no error code', async () => {
      const payload = {}
      vi.mocked(postRequestToBackend).mockResolvedValue({
        res: { statusCode: 502 },
        payload
      })

      const result = await checkBoundary('upload-123')

      expect(result).toEqual({
        failureReason: 'boundary_check_failed',
        geojson: payload
      })
    })

    it('should fall back to boundary_check_failed when the payload code is unrecognised', async () => {
      const payload = { error: 'some_new_code_the_frontend_does_not_know' }
      vi.mocked(postRequestToBackend).mockResolvedValue({
        res: { statusCode: 400 },
        payload
      })

      const result = await checkBoundary('upload-123')

      expect(result.failureReason).toBe('boundary_check_failed')
    })

    it('should return failureReason when request throws with no payload', async () => {
      vi.mocked(postRequestToBackend).mockRejectedValue(
        new Error('ECONNREFUSED')
      )

      const result = await checkBoundary('upload-123')

      expect(result).toEqual({
        failureReason: 'boundary_check_failed'
      })
    })

    it('should return failureReason and geojson when request throws with a code and boundaryGeometryWgs84 in payload', async () => {
      const mockGeometry = {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: { type: 'Polygon' } }]
      }
      const responsePayload = {
        error: 'self_intersecting_geometry',
        boundaryGeometryWgs84: mockGeometry
      }
      const error = new Error('Bad Request')
      error.output = { statusCode: 400 }
      error.data = { payload: responsePayload }
      vi.mocked(postRequestToBackend).mockRejectedValue(error)

      const result = await checkBoundary('upload-123')

      expect(result).toEqual({
        failureReason: 'self_intersecting_geometry',
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
        expect.any(Error),
        expect.stringContaining('statusCode: 400')
      )
    })

    describe('known codes', () => {
      const allCodes = Object.values(BOUNDARY_ERRORS).flatMap((group) =>
        Object.values(group)
      )

      it.each(allCodes)(
        'passes through the known code %j unchanged',
        async (code) => {
          vi.mocked(postRequestToBackend).mockResolvedValue({
            res: { statusCode: 400 },
            payload: { error: code }
          })

          const result = await checkBoundary('upload-123')

          expect(result.failureReason).toBe(code)
        }
      )
    })
  })

  describe('checkBoundaryGeometry', () => {
    const geometry = {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
          [0, 0]
        ]
      ]
    }

    it('should return geojson on a successful response', async () => {
      const mockGeojson = {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: { type: 'Polygon' } }]
      }

      vi.mocked(postRequestToBackend).mockResolvedValue({
        res: { statusCode: 200 },
        payload: mockGeojson
      })

      const result = await checkBoundaryGeometry(geometry)

      expect(postRequestToBackend).toHaveBeenCalledWith({
        endpointPath: '/boundary/check',
        payload: { geometry }
      })
      expect(result).toEqual({ geojson: mockGeojson })
    })

    it('should return failureReason and geojson from payload when status >= 400', async () => {
      const payload = { error: 'self_intersecting_geometry' }
      vi.mocked(postRequestToBackend).mockResolvedValue({
        res: { statusCode: 400 },
        payload
      })

      const result = await checkBoundaryGeometry(geometry)

      expect(result).toEqual({
        failureReason: 'self_intersecting_geometry',
        geojson: payload,
        statusCode: 400
      })
    })

    it('should fall back to boundary_check_failed when payload has no error code', async () => {
      const payload = {}
      vi.mocked(postRequestToBackend).mockResolvedValue({
        res: { statusCode: 502 },
        payload
      })

      const result = await checkBoundaryGeometry(geometry)

      expect(result).toEqual({
        failureReason: 'boundary_check_failed',
        geojson: payload,
        statusCode: 502
      })
    })

    it('should return failureReason when request throws with no payload', async () => {
      vi.mocked(postRequestToBackend).mockRejectedValue(
        new Error('ECONNREFUSED')
      )

      const result = await checkBoundaryGeometry(geometry)

      expect(result).toEqual({
        failureReason: 'boundary_check_failed',
        statusCode: undefined
      })
    })

    it('should return failureReason and geojson when request throws with a code in payload', async () => {
      const responsePayload = {
        error: 'self_intersecting_geometry',
        boundaryGeometryWgs84: geometry
      }
      const error = new Error('Bad Request')
      error.output = { statusCode: 400 }
      error.data = { payload: responsePayload }
      vi.mocked(postRequestToBackend).mockRejectedValue(error)

      const result = await checkBoundaryGeometry(geometry)

      expect(result).toEqual({
        failureReason: 'self_intersecting_geometry',
        geojson: responsePayload,
        statusCode: 400
      })
    })

    it('should log error details when request throws with output info', async () => {
      const error = new Error('Bad Request')
      error.output = { statusCode: 400 }
      error.data = { payload: { detail: 'invalid geometry' } }
      vi.mocked(postRequestToBackend).mockRejectedValue(error)

      await checkBoundaryGeometry(geometry)

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.any(Error),
        expect.stringContaining('statusCode: 400')
      )
    })
  })
})
