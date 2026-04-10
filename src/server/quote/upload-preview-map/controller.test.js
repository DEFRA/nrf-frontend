import { describe, it, expect, vi } from 'vitest'
import { handler, postHandler } from './controller.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'
import { routePath as noEdpPath } from '../no-edp/routes.js'

vi.mock('../helpers/quote-session-cache/index.js', () => ({
  saveQuoteDataToCache: vi.fn()
}))

const { saveQuoteDataToCache } =
  await import('../helpers/quote-session-cache/index.js')

describe('map controller', () => {
  const mockGeometry = {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', geometry: { type: 'Polygon' } }]
  }

  const mockGeojson = {
    boundaryGeometryWgs84: mockGeometry,
    intersectingEdps: []
  }

  const mockEdpGeojson = {
    boundaryGeometryWgs84: mockGeometry,
    intersectingEdps: [
      {
        label: 'EDP 1',
        n2k_site_name: 'Site 1',
        intersection_geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-1.5, 52.0],
              [-1.4, 52.0],
              [-1.4, 52.1],
              [-1.5, 52.1],
              [-1.5, 52.0]
            ]
          ]
        },
        overlap_area_ha: 0.5,
        overlap_area_sqm: 5000.0,
        overlap_percentage: 25.0
      }
    ]
  }

  const createMockH = () => ({
    view: vi.fn().mockReturnThis(),
    redirect: vi.fn().mockReturnThis()
  })

  const createMockRequest = (geojson = null, boundaryError = null) => ({
    yar: {
      get: vi.fn().mockImplementation((key) => {
        if (key === 'boundaryGeojson') return geojson
        if (key === 'boundaryError') return boundaryError
        return null
      }),
      set: vi.fn(),
      clear: vi.fn()
    },
    payload: {}
  })

  describe('handler (GET)', () => {
    it('should redirect to upload-boundary when no geojson or error in session', () => {
      const h = createMockH()
      const request = createMockRequest(null, null)

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
          boundaryGeojson: JSON.stringify(mockGeometry),
          boundaryError: null
        })
      )
    })

    it('should render the view with error and geojson when both exist', () => {
      const h = createMockH()
      const request = createMockRequest(mockGeojson, 'Invalid geometry')

      handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        'quote/upload-preview-map/index',
        expect.objectContaining({
          pageHeading: 'Boundary Map',
          boundaryError: 'Invalid geometry',
          featureCount: 1,
          boundaryGeojson: JSON.stringify(mockGeometry)
        })
      )
    })

    it('should render the view with error and no geojson', () => {
      const h = createMockH()
      const request = createMockRequest(null, 'Unable to check boundary')

      handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        'quote/upload-preview-map/index',
        expect.objectContaining({
          pageHeading: 'Boundary Map',
          boundaryError: 'Unable to check boundary',
          featureCount: 1,
          boundaryGeojson: JSON.stringify(null)
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

      expect(saveQuoteDataToCache).toHaveBeenCalledWith(
        request,
        { boundaryGeojson: mockGeojson, boundaryFilename: null },
        { boundaryChanged: true }
      )
      expect(request.yar.clear).toHaveBeenCalledWith('boundaryGeojson')
      expect(request.yar.clear).toHaveBeenCalledWith('boundaryError')
      expect(h.redirect).toHaveBeenCalledWith(noEdpPath)
    })

    it('should save and redirect to development-types when boundary intersects EDP', () => {
      const h = createMockH()
      const request = createMockRequest(mockEdpGeojson)

      postHandler(request, h)

      expect(saveQuoteDataToCache).toHaveBeenCalledWith(
        request,
        { boundaryGeojson: mockEdpGeojson, boundaryFilename: null },
        { boundaryChanged: true }
      )
      expect(request.yar.clear).toHaveBeenCalledWith('boundaryGeojson')
      expect(request.yar.clear).toHaveBeenCalledWith('boundaryError')
      expect(h.redirect).toHaveBeenCalledWith('/quote/development-types')
    })

    it('should lift boundaryFilename from boundaryGeojson when saving to cache', () => {
      const h = createMockH()
      const geojsonWithFilename = {
        ...mockGeojson,
        boundaryFilename: 'site-boundary.shp'
      }
      const request = createMockRequest(geojsonWithFilename)

      postHandler(request, h)

      expect(saveQuoteDataToCache).toHaveBeenCalledWith(
        request,
        {
          boundaryGeojson: geojsonWithFilename,
          boundaryFilename: 'site-boundary.shp'
        },
        { boundaryChanged: true }
      )
    })
  })
})
