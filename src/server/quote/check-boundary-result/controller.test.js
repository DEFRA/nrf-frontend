import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handler, postHandler } from './controller.js'

vi.mock('../session-cache.js', () => ({
  saveQuoteDataToCache: vi.fn(),
  getValidationFlashFromCache: vi.fn(),
  clearValidationFlashFromCache: vi.fn()
}))

const { saveQuoteDataToCache, getValidationFlashFromCache } =
  await import('../session-cache.js')

describe('check-boundary-result controller', () => {
  const mockGeojson = {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', geometry: { type: 'Polygon' } }]
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

      expect(h.redirect).toHaveBeenCalledWith('/quote/upload-boundary')
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
          boundaryGeojson: JSON.stringify(mockGeojson),
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
      expect(h.redirect).toHaveBeenCalledWith('/quote/upload-boundary')
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

      expect(h.redirect).toHaveBeenCalledWith('/quote/upload-boundary')
    })
  })
})
