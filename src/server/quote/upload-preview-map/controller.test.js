import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handler, postHandler } from './controller.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'
import { routePath as noEdpPath } from '../no-edp/routes.js'

vi.mock('../helpers/get-quote-session/index.js', () => ({
  saveQuoteDataToCache: vi.fn()
}))

const { saveQuoteDataToCache } =
  await import('../helpers/get-quote-session/index.js')

describe('map controller', () => {
  const mockGeometry = {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', geometry: { type: 'Polygon' } }]
  }

  const mockGeojson = {
    geometry: mockGeometry,
    intersecting_edps: [],
    intersects_edp: false
  }

  const mockEdpGeojson = {
    geometry: mockGeometry,
    intersecting_edps: [{ label: 'EDP 1', n2k_site_name: 'Site 1' }],
    intersects_edp: true
  }

  const createMockH = () => ({
    view: vi.fn().mockReturnThis(),
    redirect: vi.fn().mockReturnThis()
  })

  const createMockRequest = (geojson = null) => ({
    yar: {
      get: vi.fn().mockImplementation((key) => {
        if (key === 'boundaryGeojson') return geojson
        return null
      }),
      set: vi.fn(),
      clear: vi.fn()
    },
    payload: {}
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('handler (GET)', () => {
    it('should redirect to upload-boundary when no geojson in session', () => {
      const h = createMockH()
      const request = createMockRequest(null)

      handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(uploadBoundaryPath)
    })

    it('should render the view with boundary data', () => {
      const h = createMockH()
      const request = createMockRequest(mockGeojson)

      handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        'quote/upload-preview-map/index',
        expect.objectContaining({
          pageHeading: 'Boundary Map',
          featureCount: 1,
          boundaryGeojson: JSON.stringify(mockGeometry)
        })
      )
    })
  })

  describe('postHandler (POST)', () => {
    it('should redirect to upload-boundary when no geojson in session', () => {
      const h = createMockH()
      const request = createMockRequest(null)

      postHandler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(uploadBoundaryPath)
    })

    it('should save and redirect to no-edp when boundary does not intersect EDP', () => {
      const h = createMockH()
      const request = createMockRequest(mockGeojson)

      postHandler(request, h)

      expect(saveQuoteDataToCache).toHaveBeenCalledWith(request, {
        boundaryGeojson: mockGeojson
      })
      expect(request.yar.clear).toHaveBeenCalledWith('boundaryGeojson')
      expect(h.redirect).toHaveBeenCalledWith(noEdpPath)
    })

    it('should save and redirect to development-types when boundary intersects EDP', () => {
      const h = createMockH()
      const request = createMockRequest(mockEdpGeojson)

      postHandler(request, h)

      expect(saveQuoteDataToCache).toHaveBeenCalledWith(request, {
        boundaryGeojson: mockEdpGeojson
      })
      expect(request.yar.clear).toHaveBeenCalledWith('boundaryGeojson')
      expect(h.redirect).toHaveBeenCalledWith('/quote/development-types')
    })
  })
})
