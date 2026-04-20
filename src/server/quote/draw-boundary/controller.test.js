import { checkBoundaryGeometry } from '../../common/services/boundary.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { checkPath } from './routes.js'
import { saveBoundaryHandler } from './controller.js'
import { routePath as noEdpPath } from '../no-edp/routes.js'

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

  it('should propagate the backend status code and pass through geojson on backend failure', async () => {
    vi.mocked(checkBoundaryGeometry).mockResolvedValue({
      error: 'Invalid geometry',
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
      error: 'Invalid geometry',
      geojson: { boundaryGeometryWgs84: { type: 'Polygon', coordinates: [] } }
    })
  })

  it('should propagate a 502 from the backend when the impact assessor is unreachable', async () => {
    vi.mocked(checkBoundaryGeometry).mockResolvedValue({
      error: 'Unable to contact impact assessor service',
      statusCode: statusCodes.badGateway
    })

    const response = await getServer().inject({
      method: 'POST',
      url: checkPath,
      payload: { geometry: validGeometry }
    })

    expect(response.statusCode).toBe(statusCodes.badGateway)
    expect(JSON.parse(response.payload)).toEqual({
      error: 'Unable to contact impact assessor service'
    })
  })

  it('should default to 400 when the service returns no status code', async () => {
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

describe('saveBoundaryHandler', () => {
  const createMockH = () => ({
    redirect: vi.fn().mockReturnThis()
  })

  const createMockRequest = (boundaryGeojson = null) => ({
    yar: {
      get: vi.fn().mockImplementation((key) => {
        if (key === 'boundaryGeojson') {
          return boundaryGeojson
        }
        return null
      }),
      clear: vi.fn()
    }
  })

  it('redirects back to draw page when no boundary geojson is in session', () => {
    const h = createMockH()
    const request = createMockRequest()

    saveBoundaryHandler(request, h)

    expect(h.redirect).toHaveBeenCalledWith('/quote/draw-boundary')
  })

  it('saves and redirects to development types when there are intersections', () => {
    const h = createMockH()
    const boundaryGeojson = {
      boundaryGeometryWgs84: { type: 'Polygon', coordinates: [] },
      intersectingEdps: [{ code: 'EDP-1' }]
    }
    const request = createMockRequest(boundaryGeojson)

    saveBoundaryHandler(request, h)

    expect(saveQuoteDataToCache).toHaveBeenCalledWith(request, {
      boundaryGeojson
    })
    expect(request.yar.clear).toHaveBeenCalledWith('boundaryGeojson')
    expect(request.yar.clear).toHaveBeenCalledWith('boundaryError')
    expect(h.redirect).toHaveBeenCalledWith('/quote/development-types')
  })

  it('saves and redirects to no-edp when there are no intersections', () => {
    const h = createMockH()
    const boundaryGeojson = {
      boundaryGeometryWgs84: { type: 'Polygon', coordinates: [] },
      intersectingEdps: []
    }
    const request = createMockRequest(boundaryGeojson)

    saveBoundaryHandler(request, h)

    expect(saveQuoteDataToCache).toHaveBeenCalledWith(request, {
      boundaryGeojson
    })
    expect(request.yar.clear).toHaveBeenCalledWith('boundaryGeojson')
    expect(request.yar.clear).toHaveBeenCalledWith('boundaryError')
    expect(h.redirect).toHaveBeenCalledWith(noEdpPath)
  })
})
