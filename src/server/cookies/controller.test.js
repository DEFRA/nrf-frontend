import { vi } from 'vitest'
import { cookiesController, cookiesSubmitController } from './controller.js'
import {
  setCookiePreferences,
  getCookiePreferences
} from './helpers/cookie-service.js'
import {
  clearValidationFlashFromCache,
  getValidationFlashFromCache,
  saveValidationFlashToCache
} from '../quote/helpers/form-validation-session/index.js'

vi.mock('./helpers/cookie-preferences.js')
vi.mock('./helpers/cookie-service.js')
vi.mock('../quote/helpers/form-validation-session/index.js')

const createMockRequest = (overrides = {}) => ({
  query: {},
  payload: {},
  path: '/cookies',
  state: {},
  logger: { error: vi.fn() },
  ...overrides
})

const createMockResponse = () => ({
  state: vi.fn().mockReturnThis(),
  code: vi.fn().mockReturnThis(),
  takeover: vi.fn().mockReturnThis()
})

const createMockH = (response) => ({
  view: vi.fn(),
  redirect: vi.fn().mockReturnValue(response)
})

describe('cookiesController (GET)', () => {
  let mockRequest
  let mockH
  let mockResponse

  beforeEach(() => {
    mockRequest = createMockRequest()
    mockResponse = createMockResponse()
    mockH = createMockH(mockResponse)
    getCookiePreferences.mockReturnValue({
      essential: true,
      analytics: null,
      timestamp: null
    })
    getValidationFlashFromCache.mockReturnValue(undefined)
  })

  test('disables auth', () => {
    expect(cookiesController.options.auth).toBe(false)
  })

  test('renders the cookies view with default state', () => {
    cookiesController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith('cookies/index', {
      pageTitle: 'Cookies on Nature Restoration Fund',
      payload: { analytics: undefined },
      showSuccessBanner: false,
      backUrl: '/',
      redirectUrl: '',
      validationErrors: undefined
    })
  })

  test('pre-selects "yes" when analytics is enabled', () => {
    getCookiePreferences.mockReturnValue({
      essential: true,
      analytics: true,
      timestamp: 1
    })

    cookiesController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'cookies/index',
      expect.objectContaining({ payload: { analytics: 'yes' } })
    )
  })

  test('pre-selects "no" when analytics is rejected', () => {
    getCookiePreferences.mockReturnValue({
      essential: true,
      analytics: false,
      timestamp: 1
    })

    cookiesController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'cookies/index',
      expect.objectContaining({ payload: { analytics: 'no' } })
    )
  })

  test('shows the success banner when ?success=true', () => {
    mockRequest.query.success = 'true'

    cookiesController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'cookies/index',
      expect.objectContaining({ showSuccessBanner: true })
    )
  })

  test('uses redirectUrl from the query as backUrl when safe', () => {
    mockRequest.query.redirectUrl = '/quote/boundary-type'

    cookiesController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'cookies/index',
      expect.objectContaining({
        backUrl: '/quote/boundary-type',
        redirectUrl: '/quote/boundary-type'
      })
    )
  })

  test('rejects unsafe redirectUrl values', () => {
    mockRequest.query.redirectUrl = 'https://evil.example.com'

    cookiesController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'cookies/index',
      expect.objectContaining({ backUrl: '/', redirectUrl: '' })
    )
  })

  test('rejects protocol-relative redirectUrl values', () => {
    mockRequest.query.redirectUrl = '//evil.example.com'

    cookiesController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'cookies/index',
      expect.objectContaining({ backUrl: '/', redirectUrl: '' })
    )
  })

  test('passes validation errors from the flash cache to the view', () => {
    const validationErrors = {
      summary: [{ href: '#analytics', text: 'Select…', field: 'analytics' }],
      messagesByFormField: { analytics: { text: 'Select…' } }
    }
    getValidationFlashFromCache.mockReturnValue({ validationErrors })

    cookiesController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'cookies/index',
      expect.objectContaining({ validationErrors })
    )
  })
})

describe('cookiesSubmitController (POST)', () => {
  let mockRequest
  let mockH
  let mockResponse

  beforeEach(() => {
    mockRequest = createMockRequest()
    mockResponse = createMockResponse()
    mockH = createMockH(mockResponse)
  })

  test('disables auth and validates payload', () => {
    expect(cookiesSubmitController.options.auth).toBe(false)
    expect(cookiesSubmitController.options.validate.payload).toBeDefined()
  })

  describe('handler', () => {
    test('persists analytics=yes and redirects to the success view', () => {
      mockRequest.payload = { analytics: 'yes', source: 'page' }

      const result = cookiesSubmitController.handler(mockRequest, mockH)

      expect(setCookiePreferences).toHaveBeenCalledWith(mockResponse, true)
      expect(clearValidationFlashFromCache).toHaveBeenCalledWith(mockRequest)
      expect(mockH.redirect).toHaveBeenCalledWith('/cookies?success=true')
      expect(result).toBe(mockResponse)
    })

    test('persists analytics=no and redirects to the success view', () => {
      mockRequest.payload = { analytics: 'no', source: 'page' }

      cookiesSubmitController.handler(mockRequest, mockH)

      expect(setCookiePreferences).toHaveBeenCalledWith(mockResponse, false)
      expect(mockH.redirect).toHaveBeenCalledWith('/cookies?success=true')
    })

    test('preserves a safe redirectUrl through the success redirect', () => {
      mockRequest.payload = {
        analytics: 'yes',
        source: 'page',
        redirectUrl: '/quote/boundary-type'
      }

      cookiesSubmitController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/cookies?success=true&redirectUrl=%2Fquote%2Fboundary-type'
      )
    })

    test('redirects back to redirectUrl with cookies_updated=1 when source=banner', () => {
      mockRequest.payload = {
        analytics: 'yes',
        source: 'banner',
        redirectUrl: '/quote/boundary-type'
      }

      cookiesSubmitController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/quote/boundary-type?cookies_updated=1'
      )
    })

    test('appends cookies_updated=1 with & when redirectUrl already has a query string', () => {
      mockRequest.payload = {
        analytics: 'yes',
        source: 'banner',
        redirectUrl: '/quote/boundary-type?ref=task-list'
      }

      cookiesSubmitController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/quote/boundary-type?ref=task-list&cookies_updated=1'
      )
    })

    test('falls back to "/" when banner submit has no safe redirectUrl', () => {
      mockRequest.payload = {
        analytics: 'no',
        source: 'banner',
        redirectUrl: 'https://evil.example.com'
      }

      cookiesSubmitController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/?cookies_updated=1')
    })

    test('wraps thrown errors as Boom internal and logs them', () => {
      mockRequest.payload = { analytics: 'yes', source: 'page' }
      const error = new Error('boom')
      setCookiePreferences.mockImplementation(() => {
        throw error
      })

      expect(() => cookiesSubmitController.handler(mockRequest, mockH)).toThrow(
        'Error saving cookie preferences'
      )
      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        error,
        'Error saving cookie preferences'
      )
    })
  })

  describe('failAction', () => {
    test('saves validation errors to flash and redirects back to the form', () => {
      const failAction = cookiesSubmitController.options.validate.failAction
      mockRequest.payload = { analytics: '' }
      const err = {
        details: [
          {
            path: ['analytics'],
            message: 'Select if you want to accept analytics cookies',
            type: 'any.required'
          }
        ]
      }

      failAction(mockRequest, mockH, err)

      expect(saveValidationFlashToCache).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          validationErrors: expect.objectContaining({
            messagesByFormField: expect.objectContaining({
              analytics: expect.any(Object)
            })
          }),
          formSubmitData: { analytics: '' }
        })
      )
      expect(mockH.redirect).toHaveBeenCalledWith('/cookies')
      expect(mockResponse.takeover).toHaveBeenCalled()
    })

    test('preserves redirectUrl through the failure redirect', () => {
      const failAction = cookiesSubmitController.options.validate.failAction
      mockRequest.payload = {
        analytics: '',
        redirectUrl: '/quote/boundary-type'
      }
      const err = {
        details: [
          {
            path: ['analytics'],
            message: 'Select if you want to accept analytics cookies',
            type: 'any.required'
          }
        ]
      }

      failAction(mockRequest, mockH, err)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/cookies?redirectUrl=%2Fquote%2Fboundary-type'
      )
    })
  })
})
