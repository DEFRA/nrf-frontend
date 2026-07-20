import { checkBoundaryGeometry } from '../../common/services/boundary.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { checkPath, savePath } from './routes.js'
import { routePath as noEdpPath } from '../no-edp/routes.js'
import { boundaryGeojsonWithEdp } from '../../../test-utils/fixtures/boundary-geojson.js'

vi.mock('../helpers/quote-session-cache/index.js', () => ({
  saveQuoteDataToCache: vi.fn()
}))

const { saveQuoteDataToCache } =
  await import('../helpers/quote-session-cache/index.js')

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

  it('should propagate the backend status code, resolve the failureReason to display copy, and pass through geojson on backend failure', async () => {
    vi.mocked(checkBoundaryGeometry).mockResolvedValue({
      failureReason: 'self_intersecting_geometry',
      geojson: { boundaryGeometryWgs84: { type: 'Polygon', coordinates: [] } },
      statusCode: statusCodes.badRequest
    })

    const response = await getServer().inject({
      method: 'POST',
      url: checkPath,
      payload: { geometry: validGeometry }
    })

    expect(response.statusCode).toBe(statusCodes.badRequest)
    expect(JSON.parse(response.payload)).toEqual({
      error:
        'The uploaded boundary contains invalid geometry (self-intersecting or crossing line segments). Please correct the boundary so that edges do not cross each other and try again.',
      geojson: { boundaryGeometryWgs84: { type: 'Polygon', coordinates: [] } }
    })
  })

  it('should propagate a 502 from the backend when the impact assessor is unreachable', async () => {
    vi.mocked(checkBoundaryGeometry).mockResolvedValue({
      failureReason: 'impact_assessor_unreachable',
      statusCode: statusCodes.badGateway
    })

    const response = await getServer().inject({
      method: 'POST',
      url: checkPath,
      payload: { geometry: validGeometry }
    })

    expect(response.statusCode).toBe(statusCodes.badGateway)
    expect(JSON.parse(response.payload)).toEqual({
      error: 'Unable to check the boundary right now. Please try again.'
    })
  })

  it('should default to 400 when the service returns no status code', async () => {
    vi.mocked(checkBoundaryGeometry).mockResolvedValue({
      failureReason: 'boundary_check_failed'
    })

    const response = await getServer().inject({
      method: 'POST',
      url: checkPath,
      payload: { geometry: validGeometry }
    })

    expect(response.statusCode).toBe(statusCodes.badRequest)
    expect(JSON.parse(response.payload)).toEqual({
      error: 'Unable to check the boundary. Please try again.'
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

  it('should reject a Polygon with empty coordinates array', async () => {
    const response = await getServer().inject({
      method: 'POST',
      url: checkPath,
      payload: { geometry: { type: 'Polygon', coordinates: [] } }
    })

    expect(response.statusCode).toBe(statusCodes.badRequest)
    expect(checkBoundaryGeometry).not.toHaveBeenCalled()
  })

  it('should reject a Polygon with a ring of fewer than 4 positions', async () => {
    const response = await getServer().inject({
      method: 'POST',
      url: checkPath,
      payload: {
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [1, 0],
              [0, 0]
            ]
          ]
        }
      }
    })

    expect(response.statusCode).toBe(statusCodes.badRequest)
    expect(checkBoundaryGeometry).not.toHaveBeenCalled()
  })

  it('should reject a Polygon with non-numeric coordinates', async () => {
    const response = await getServer().inject({
      method: 'POST',
      url: checkPath,
      payload: {
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              ['a', 'b'],
              ['c', 'd'],
              ['e', 'f'],
              ['a', 'b']
            ]
          ]
        }
      }
    })

    expect(response.statusCode).toBe(statusCodes.badRequest)
    expect(checkBoundaryGeometry).not.toHaveBeenCalled()
  })

  it('should reject a Polygon position with the wrong arity', async () => {
    const response = await getServer().inject({
      method: 'POST',
      url: checkPath,
      payload: {
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0, 0],
              [1, 0, 0],
              [1, 1, 0],
              [0, 0, 0]
            ]
          ]
        }
      }
    })

    expect(response.statusCode).toBe(statusCodes.badRequest)
    expect(checkBoundaryGeometry).not.toHaveBeenCalled()
  })
})

describe('POST /quote/draw-boundary/save', () => {
  const getServer = setupTestServer()

  const validBoundaryGeojson = {
    intersectingEdps: [],
    boundaryGeometryWgs84: { type: 'Polygon', coordinates: [] },
    boundaryMetadata: { areaHa: 1 },
    boundaryGeometryOriginal: { type: 'Polygon', coordinates: [] }
  }

  it('saves and redirects to email when there are intersections', async () => {
    const response = await getServer().inject({
      method: 'POST',
      url: savePath,
      payload: { boundaryGeojson: boundaryGeojsonWithEdp }
    })

    expect(saveQuoteDataToCache).toHaveBeenCalledWith(expect.anything(), {
      boundaryGeojson: boundaryGeojsonWithEdp
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/quote/email')
  })

  it('saves and redirects to no-edp when there are no intersections', async () => {
    const response = await getServer().inject({
      method: 'POST',
      url: savePath,
      payload: { boundaryGeojson: validBoundaryGeojson }
    })

    expect(saveQuoteDataToCache).toHaveBeenCalledWith(expect.anything(), {
      boundaryGeojson: validBoundaryGeojson
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(noEdpPath)
  })

  it('rejects a request with no boundaryGeojson', async () => {
    const response = await getServer().inject({
      method: 'POST',
      url: savePath,
      payload: {}
    })

    expect(response.statusCode).toBe(statusCodes.badRequest)
    expect(saveQuoteDataToCache).not.toHaveBeenCalled()
  })

  it.each([
    'intersectingEdps',
    'boundaryGeometryWgs84',
    'boundaryMetadata',
    'boundaryGeometryOriginal'
  ])('rejects a request with missing %s', async (missingKey) => {
    const { [missingKey]: _omitted, ...partial } = validBoundaryGeojson

    const response = await getServer().inject({
      method: 'POST',
      url: savePath,
      payload: { boundaryGeojson: partial }
    })

    expect(response.statusCode).toBe(statusCodes.badRequest)
    expect(saveQuoteDataToCache).not.toHaveBeenCalled()
  })
})
