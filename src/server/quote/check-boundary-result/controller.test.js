import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handler, postHandler } from './controller.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'

vi.mock('../helpers/get-quote-session/index.js', () => ({
  saveQuoteDataToCache: vi.fn()
}))

vi.mock('../helpers/form-validation-session/index.js', () => ({
  getValidationFlashFromCache: vi.fn(),
  clearValidationFlashFromCache: vi.fn()
}))

const { saveQuoteDataToCache } =
  await import('../helpers/get-quote-session/index.js')
const { getValidationFlashFromCache } =
  await import('../helpers/form-validation-session/index.js')

describe('check-boundary-result controller', () => {
  const mockGeometry = {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', geometry: { type: 'Polygon' } }]
  }

  const mockGeojson = {
    geometry: mockGeometry,
    intersecting_edps: [],
    intersects_edp: false
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
    vi.mocked(getValidationFlashFromCache).mockReturnValue(null)
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
        'quote/check-boundary-result/index',
        expect.objectContaining({
          pageHeading: 'Check your boundary',
          featureCount: 1,
          boundaryGeojson: JSON.stringify(mockGeometry),
          formSubmitData: {},
          validationErrors: undefined
        })
      )
    })

    it('should include validation errors from flash', () => {
      const mockErrors = {
        validationErrors: {
          summary: [{ text: 'Select if the boundary is correct' }],
          messagesByFormField: {
            boundaryCorrect: { text: 'Select if the boundary is correct' }
          }
        },
        formSubmitData: {}
      }
      vi.mocked(getValidationFlashFromCache).mockReturnValue(mockErrors)

      const h = createMockH()
      const request = createMockRequest(mockGeojson)

      handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        'quote/check-boundary-result/index',
        expect.objectContaining({
          validationErrors: mockErrors.validationErrors,
          formSubmitData: {}
        })
      )
    })
  })

  describe('postHandler (POST)', () => {
    it('should redirect to upload-boundary when user says no', () => {
      const h = createMockH()
      const request = createMockRequest(mockGeojson)
      request.payload = { boundaryCorrect: 'no' }

      postHandler(request, h)

      expect(request.yar.clear).toHaveBeenCalledWith('boundaryGeojson')
      expect(h.redirect).toHaveBeenCalledWith(uploadBoundaryPath)
    })

    it('should save to quote data and redirect when user confirms', () => {
      const h = createMockH()
      const request = createMockRequest(mockGeojson)
      request.payload = { boundaryCorrect: 'yes' }

      postHandler(request, h)

      expect(saveQuoteDataToCache).toHaveBeenCalledWith(request, {
        boundaryGeojson: mockGeojson
      })
      expect(request.yar.clear).toHaveBeenCalledWith('boundaryGeojson')
      expect(h.redirect).toHaveBeenCalledWith('/quote/development-types')
    })

    it('should redirect to upload-boundary when no geojson in session', () => {
      const h = createMockH()
      const request = createMockRequest(null)
      request.payload = { boundaryCorrect: 'yes' }

      postHandler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(uploadBoundaryPath)
    })
  })
})
