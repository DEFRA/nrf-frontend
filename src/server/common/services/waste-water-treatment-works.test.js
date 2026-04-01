import { describe, it, expect, vi } from 'vitest'
import { postRequestToBackend } from './nrf-backend.js'
import { getWasteWaterTreatmentWorks } from './waste-water-treatment-works.js'

vi.mock('./nrf-backend.js')

const mockLogger = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn()
}))

vi.mock('../helpers/logging/logger.js', () => ({
  createLogger: () => mockLogger
}))

const mockBoundaryGeometry = {
  type: 'Polygon',
  coordinates: [
    [
      [400000, 300000],
      [400100, 300000],
      [400100, 300100],
      [400000, 300100],
      [400000, 300000]
    ]
  ]
}

describe('waste-water-treatment-works service', () => {
  describe('getWasteWaterTreatmentWorks', () => {
    it('should return mapped WWTW list on successful response', async () => {
      vi.mocked(postRequestToBackend).mockResolvedValue({
        res: { statusCode: 200 },
        payload: {
          nearbyWwtws: [
            { wwtwId: '101', wwtwName: 'Great Billing WRC', distanceKm: 3.2 },
            { wwtwId: '202', wwtwName: 'Letchworth WWTP', distanceKm: 7.5 }
          ]
        }
      })

      const result = await getWasteWaterTreatmentWorks(mockBoundaryGeometry)

      expect(postRequestToBackend).toHaveBeenCalledWith({
        endpointPath: '/wwtw/nearby',
        payload: { geometry: mockBoundaryGeometry }
      })
      expect(result).toEqual([
        { id: '101', name: 'Great Billing WRC', distance: 3.2 },
        { id: '202', name: 'Letchworth WWTP', distance: 7.5 }
      ])
    })

    it('should return empty array when backend returns error status', async () => {
      vi.mocked(postRequestToBackend).mockResolvedValue({
        res: { statusCode: 500 },
        payload: { error: 'Internal server error' }
      })

      const result = await getWasteWaterTreatmentWorks(mockBoundaryGeometry)

      expect(result).toEqual([])
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should return empty array when request throws', async () => {
      vi.mocked(postRequestToBackend).mockRejectedValue(
        new Error('ECONNREFUSED')
      )

      const result = await getWasteWaterTreatmentWorks(mockBoundaryGeometry)

      expect(result).toEqual([])
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should return empty array when no boundary geometry provided', async () => {
      const result = await getWasteWaterTreatmentWorks(undefined)

      expect(result).toEqual([])
      expect(postRequestToBackend).not.toHaveBeenCalled()
    })

    it('should return empty array when nearbyWwtws is missing from payload', async () => {
      vi.mocked(postRequestToBackend).mockResolvedValue({
        res: { statusCode: 200 },
        payload: {}
      })

      const result = await getWasteWaterTreatmentWorks(mockBoundaryGeometry)

      expect(result).toEqual([])
    })

    it('should coerce wwtw id to string', async () => {
      vi.mocked(postRequestToBackend).mockResolvedValue({
        res: { statusCode: 200 },
        payload: {
          nearbyWwtws: [{ wwtwId: 101, wwtwName: 'Test WWTW', distanceKm: 1.0 }]
        }
      })

      const result = await getWasteWaterTreatmentWorks(mockBoundaryGeometry)

      expect(result[0].id).toBe('101')
    })
  })
})
