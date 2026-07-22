import { describe, it, expect, vi } from 'vitest'
import { handler, postHandler } from './controller.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'
import { routePath as noEdpPath } from '../no-edp/routes.js'

vi.mock('../helpers/quote-session-cache/index.js', () => ({
  saveQuoteDataToCache: vi.fn(),
  getQuoteDataFromCache: vi.fn().mockReturnValue({})
}))

const { saveQuoteDataToCache, getQuoteDataFromCache } =
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

  const mockGeojsonWithFilename = {
    ...mockGeojson,
    boundaryFilename: 'site-boundary.shp'
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

  const createMockRequest = (geojson = null, boundaryFailureReason = null) => ({
    yar: {
      get: vi.fn().mockImplementation((key) => {
        if (key === 'boundaryGeojson') return geojson
        if (key === 'boundaryFailureReason') return boundaryFailureReason
        return null
      }),
      set: vi.fn(),
      clear: vi.fn()
    },
    payload: {}
  })

  describe('handler (GET)', () => {
    it('should redirect to upload-boundary when no geojson, no error, and no cached boundary', () => {
      const h = createMockH()
      const request = createMockRequest(null, null)
      getQuoteDataFromCache.mockReturnValue({})

      handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(uploadBoundaryPath)
    })

    it('should redirect to no-edp when a valid boundary does not intersect an EDP', () => {
      const h = createMockH()
      const request = createMockRequest(mockGeojson)
      getQuoteDataFromCache.mockReturnValue({})

      handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(noEdpPath)
      expect(h.view).not.toHaveBeenCalled()
    })

    it('should redirect to no-edp when the non-intersecting boundary is only in the quote cache', () => {
      const h = createMockH()
      const request = createMockRequest(null, null)
      getQuoteDataFromCache.mockReturnValue({ boundaryGeojson: mockGeojson })

      handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(noEdpPath)
    })

    it('should render the view with boundary data when it intersects an EDP', () => {
      const h = createMockH()
      const request = createMockRequest(mockEdpGeojson)
      getQuoteDataFromCache.mockReturnValue({})

      handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        'quote/upload-preview-map/index',
        expect.objectContaining({
          pageHeading: 'Your uploaded red line boundary file',
          featureCount: 1,
          boundaryGeojson: JSON.stringify(mockGeometry),
          boundaryError: null,
          boundaryFilename: null
        })
      )
    })

    it('should pass boundaryFilename from session geojson to the view', () => {
      const h = createMockH()
      const request = createMockRequest({
        ...mockEdpGeojson,
        boundaryFilename: 'site-boundary.shp'
      })
      getQuoteDataFromCache.mockReturnValue({})

      handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        'quote/upload-preview-map/index',
        expect.objectContaining({
          boundaryFilename: 'site-boundary.shp'
        })
      )
    })

    it('should render the view with error and geojson when both exist', () => {
      const h = createMockH()
      const request = createMockRequest(mockGeojson, 'boundary_check_failed')
      getQuoteDataFromCache.mockReturnValue({})

      handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        'quote/upload-preview-map/index',
        expect.objectContaining({
          pageHeading: 'Your red line boundary file contains an error',
          boundaryError: 'Unable to check the boundary. Please try again.',
          featureCount: 1,
          boundaryGeojson: JSON.stringify(mockGeometry)
        })
      )
    })

    it('should render the view with error and no geojson', () => {
      const h = createMockH()
      const request = createMockRequest(null, 'boundary_check_failed')
      getQuoteDataFromCache.mockReturnValue({})

      handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        'quote/upload-preview-map/index',
        expect.objectContaining({
          pageHeading: 'Your red line boundary file contains an error',
          boundaryError: 'Unable to check the boundary. Please try again.',
          featureCount: 1,
          boundaryGeojson: JSON.stringify(null)
        })
      )
    })

    it('should pass uploadStatus, failureReason, and mapped copy to the view when there is an error', () => {
      const h = createMockH()
      const request = createMockRequest(null, 'file_size_too_large')
      getQuoteDataFromCache.mockReturnValue({})

      handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        'quote/upload-preview-map/index',
        expect.objectContaining({
          uploadStatus: 'failure',
          failureReason: 'file_size_too_large',
          boundaryError: 'The selected file must be smaller than 2MB.'
        })
      )
    })

    it('should pass a success uploadStatus and null failureReason when there is no error', () => {
      const h = createMockH()
      const request = createMockRequest(mockEdpGeojson)
      getQuoteDataFromCache.mockReturnValue({})

      handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        'quote/upload-preview-map/index',
        expect.objectContaining({
          uploadStatus: 'success',
          failureReason: null
        })
      )
    })
  })

  describe('postHandler (POST)', () => {
    it('should redirect to upload-boundary when no geojson in session or cache', () => {
      const h = createMockH()
      const request = createMockRequest(null)
      getQuoteDataFromCache.mockReturnValue({})

      postHandler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(uploadBoundaryPath)
    })

    it('should save the boundary and redirect to email', () => {
      const h = createMockH()
      const request = createMockRequest(mockEdpGeojson)
      getQuoteDataFromCache.mockReturnValue({})

      postHandler(request, h)

      expect(saveQuoteDataToCache).toHaveBeenCalledWith(request, {
        boundaryGeojson: mockEdpGeojson,
        boundaryFilename: null
      })
      expect(request.yar.clear).toHaveBeenCalledWith('boundaryGeojson')
      expect(request.yar.clear).toHaveBeenCalledWith('boundaryFailureReason')
      expect(h.redirect).toHaveBeenCalledWith('/quote/email')
    })

    it('should lift boundaryFilename from boundaryGeojson when saving to cache', () => {
      const h = createMockH()
      const request = createMockRequest(mockGeojsonWithFilename)
      getQuoteDataFromCache.mockReturnValue({})

      postHandler(request, h)

      expect(saveQuoteDataToCache).toHaveBeenCalledWith(request, {
        boundaryGeojson: mockGeojsonWithFilename,
        boundaryFilename: 'site-boundary.shp'
      })
    })

    it('should not re-save when the boundary is only in the quote cache and should redirect to email', () => {
      const h = createMockH()
      const request = createMockRequest(null)
      getQuoteDataFromCache.mockReturnValue({ boundaryGeojson: mockEdpGeojson })

      postHandler(request, h)

      expect(saveQuoteDataToCache).not.toHaveBeenCalled()
      expect(request.yar.clear).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith('/quote/email')
    })
  })
})
