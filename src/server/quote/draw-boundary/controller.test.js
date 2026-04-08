import { checkBoundaryGeometry } from '../../common/services/boundary.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { checkPath } from './routes.js'

vi.mock('../../common/services/boundary.js')

const validGeometry = {
  type: 'Polygon',
  coordinates: [
    [
      [-1.5, 52.0],
      [-1.4, 52.0],
      [-1.4, 52.1],
      [-1.5, 52.0]
    ]
  ]
}

describe('POST /quote/draw-boundary/check', () => {
  const getServer = setupTestServer()

  it('should return the backend geojson on success', async () => {
    const mockGeojson = {
      boundaryGeometryOriginal: { type: 'Polygon', coordinates: [] },
      boundaryGeometryWgs84: { type: 'Polygon', coordinates: [] },
      intersectingEdps: []
    }
    vi.mocked(checkBoundaryGeometry).mockResolvedValue({ geojson: mockGeojson })

    const response = await getServer().inject({
      method: 'POST',
      url: checkPath,
      payload: { geometry: validGeometry }
    })

    expect(response.statusCode).toBe(statusCodes.ok)
    expect(JSON.parse(response.payload)).toEqual(mockGeojson)
    expect(checkBoundaryGeometry).toHaveBeenCalledWith(validGeometry)
  })

  it('should return an error and pass through geojson on backend failure', async () => {
    vi.mocked(checkBoundaryGeometry).mockResolvedValue({
      error: 'Invalid geometry',
      geojson: { boundaryGeometryWgs84: { type: 'Polygon', coordinates: [] } }
    })

    const response = await getServer().inject({
      method: 'POST',
      url: checkPath,
      payload: { geometry: validGeometry }
    })

    expect(response.statusCode).toBe(statusCodes.badRequest)
    expect(JSON.parse(response.payload)).toEqual({
      error: 'Invalid geometry',
      geojson: { boundaryGeometryWgs84: { type: 'Polygon', coordinates: [] } }
    })
  })

  it('should return only the error when no geojson is present', async () => {
    vi.mocked(checkBoundaryGeometry).mockResolvedValue({
      error: 'Unable to check boundary'
    })

    const response = await getServer().inject({
      method: 'POST',
      url: checkPath,
      payload: { geometry: validGeometry }
    })

    expect(response.statusCode).toBe(statusCodes.badRequest)
    expect(JSON.parse(response.payload)).toEqual({
      error: 'Unable to check boundary'
    })
  })

  it('should reject a request with no geometry', async () => {
    const response = await getServer().inject({
      method: 'POST',
      url: checkPath,
      payload: {}
    })

    expect(response.statusCode).toBe(statusCodes.badRequest)
    expect(checkBoundaryGeometry).not.toHaveBeenCalled()
  })

  it('should reject a geometry with a missing type', async () => {
    const response = await getServer().inject({
      method: 'POST',
      url: checkPath,
      payload: { geometry: { coordinates: [] } }
    })

    expect(response.statusCode).toBe(statusCodes.badRequest)
    expect(checkBoundaryGeometry).not.toHaveBeenCalled()
  })

  it('should reject a geometry with an unsupported type', async () => {
    const response = await getServer().inject({
      method: 'POST',
      url: checkPath,
      payload: { geometry: { type: 'Point', coordinates: [0, 0] } }
    })

    expect(response.statusCode).toBe(statusCodes.badRequest)
    expect(checkBoundaryGeometry).not.toHaveBeenCalled()
  })

  it('should reject a Feature wrapper', async () => {
    const response = await getServer().inject({
      method: 'POST',
      url: checkPath,
      payload: {
        geometry: {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [] },
          properties: {}
        }
      }
    })

    expect(response.statusCode).toBe(statusCodes.badRequest)
    expect(checkBoundaryGeometry).not.toHaveBeenCalled()
  })

  it('should reject a geometry with no coordinates', async () => {
    const response = await getServer().inject({
      method: 'POST',
      url: checkPath,
      payload: { geometry: { type: 'Polygon' } }
    })

    expect(response.statusCode).toBe(statusCodes.badRequest)
    expect(checkBoundaryGeometry).not.toHaveBeenCalled()
  })
})
