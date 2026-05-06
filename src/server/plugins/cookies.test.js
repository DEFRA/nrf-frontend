import { vi } from 'vitest'
import { cookies } from './cookies.js'
import {
  COOKIE_NAME_PREFERENCES,
  COOKIE_OPTIONS,
  CONFIRMATION_QUERY_PARAM
} from '../cookies/helpers/constants.js'
import { config } from '../../config/config.js'
import {
  clearCookiePreferences,
  getCookiePreferences,
  isCookiePolicyVersionStale
} from '../cookies/helpers/cookie-service.js'

vi.mock('../cookies/helpers/cookie-service.js')
vi.mock('../../config/config.js')

const createMockServer = () => ({
  state: vi.fn(),
  ext: vi.fn()
})

const createMockRequest = (overrides = {}) => ({
  state: {},
  query: {},
  path: '/',
  url: { search: '' },
  ...overrides
})

const createMockH = () => ({ continue: Symbol('continue') })

const createMockResponse = (variety = 'view', context = {}) => ({
  variety,
  source: { context },
  unstate: vi.fn()
})

const DEFAULT_POLICY = {
  essential: true,
  analytics: null,
  version: null,
  createdAt: null
}

describe('Cookies Plugin', () => {
  let mockServer
  let mockRequest
  let mockH
  let mockResponse

  beforeEach(() => {
    mockServer = createMockServer()
    mockRequest = createMockRequest()
    mockH = createMockH()
    mockResponse = createMockResponse()
    config.get.mockReturnValue(false)
  })

  describe('plugin registration', () => {
    test('has correct plugin name', () => {
      expect(cookies.name).toBe('cookie-policy')
    })

    test('registers cookie state with insecure config in development', () => {
      cookies.register(mockServer)

      expect(mockServer.state).toHaveBeenCalledWith(COOKIE_NAME_PREFERENCES, {
        clearInvalid: true,
        ttl: COOKIE_OPTIONS.TTL,
        path: COOKIE_OPTIONS.PATH,
        isSecure: false,
        isSameSite: COOKIE_OPTIONS.IS_SAME_SITE
      })
    })

    test('registers cookie state with secure config in production', () => {
      config.get.mockReturnValue(true)

      cookies.register(mockServer)

      expect(mockServer.state).toHaveBeenCalledWith(
        COOKIE_NAME_PREFERENCES,
        expect.objectContaining({ isSecure: true })
      )
    })

    test('registers only the onPreResponse extension', () => {
      cookies.register(mockServer)

      expect(mockServer.ext).toHaveBeenCalledTimes(1)
      expect(mockServer.ext).toHaveBeenCalledWith(
        'onPreResponse',
        expect.any(Function)
      )
    })
  })

  describe('onPreResponse extension', () => {
    let onPreResponse

    beforeEach(() => {
      cookies.register(mockServer)
      onPreResponse = mockServer.ext.mock.calls.find(
        (call) => call[0] === 'onPreResponse'
      )[1]
      getCookiePreferences.mockReturnValue(DEFAULT_POLICY)
      isCookiePolicyVersionStale.mockReturnValue(false)
    })

    test('injects cookie context into view responses', () => {
      mockRequest.response = mockResponse

      const result = onPreResponse(mockRequest, mockH)

      expect(getCookiePreferences).toHaveBeenCalledWith(mockRequest)
      expect(mockResponse.source.context).toEqual({
        showCookieConfirmationBanner: false,
        cookiePolicy: DEFAULT_POLICY,
        showCookieBanner: true,
        currentUrl: '/'
      })
      expect(result).toBe(mockH.continue)
    })

    test('preserves existing context when injecting cookie context', () => {
      mockResponse = createMockResponse('view', { pageTitle: 'Test' })
      mockRequest.response = mockResponse

      onPreResponse(mockRequest, mockH)

      expect(mockResponse.source.context).toMatchObject({
        pageTitle: 'Test',
        cookiePolicy: DEFAULT_POLICY,
        showCookieBanner: true
      })
    })

    test.each([true, false])(
      'hides banner when analytics preference is set (analytics=%s)',
      (analyticsValue) => {
        mockRequest.response = mockResponse
        getCookiePreferences.mockReturnValue({
          ...DEFAULT_POLICY,
          analytics: analyticsValue
        })

        onPreResponse(mockRequest, mockH)

        expect(mockResponse.source.context.showCookieBanner).toBe(false)
      }
    )

    test('hides banner on the cookies page', () => {
      mockRequest.response = mockResponse
      mockRequest.path = '/cookies'

      onPreResponse(mockRequest, mockH)

      expect(mockResponse.source.context.showCookieBanner).toBe(false)
    })

    test('shows banner on other pages when preferences not set', () => {
      mockRequest.response = mockResponse
      mockRequest.path = '/quote/boundary-type'

      onPreResponse(mockRequest, mockH)

      expect(mockResponse.source.context.showCookieBanner).toBe(true)
    })

    test('shows confirmation banner when cookies_updated=1 query param is present', () => {
      mockRequest.response = mockResponse
      mockRequest.query = { [CONFIRMATION_QUERY_PARAM]: '1' }
      mockRequest.url.search = `?${CONFIRMATION_QUERY_PARAM}=1`

      onPreResponse(mockRequest, mockH)

      expect(mockResponse.source.context.showCookieConfirmationBanner).toBe(
        true
      )
    })

    test('strips the confirmation query param from currentUrl', () => {
      mockRequest.response = mockResponse
      mockRequest.path = '/quote/boundary-type'
      mockRequest.query = { [CONFIRMATION_QUERY_PARAM]: '1' }
      mockRequest.url.search = `?${CONFIRMATION_QUERY_PARAM}=1`

      onPreResponse(mockRequest, mockH)

      expect(mockResponse.source.context.currentUrl).toBe(
        '/quote/boundary-type'
      )
    })

    test('preserves other query params in currentUrl while stripping confirmation', () => {
      mockRequest.response = mockResponse
      mockRequest.path = '/quote/boundary-type'
      mockRequest.query = {
        ref: 'task-list',
        [CONFIRMATION_QUERY_PARAM]: '1'
      }
      mockRequest.url.search = `?ref=task-list&${CONFIRMATION_QUERY_PARAM}=1`

      onPreResponse(mockRequest, mockH)

      expect(mockResponse.source.context.currentUrl).toBe(
        '/quote/boundary-type?ref=task-list'
      )
    })

    test('includes other query strings in currentUrl', () => {
      mockRequest.response = mockResponse
      mockRequest.path = '/quote/boundary-type'
      mockRequest.url.search = '?ref=task-list'

      onPreResponse(mockRequest, mockH)

      expect(mockResponse.source.context.currentUrl).toBe(
        '/quote/boundary-type?ref=task-list'
      )
    })

    test('handles missing query string', () => {
      mockRequest.response = mockResponse
      mockRequest.path = '/quote/boundary-type'
      mockRequest.url.search = null

      onPreResponse(mockRequest, mockH)

      expect(mockResponse.source.context.currentUrl).toBe(
        '/quote/boundary-type'
      )
    })

    test('does not modify non-view responses', () => {
      const fileResponse = createMockResponse('file')
      mockRequest.response = fileResponse

      onPreResponse(mockRequest, mockH)

      expect(getCookiePreferences).not.toHaveBeenCalled()
      expect(fileResponse.source.context).toEqual({})
    })

    test('clears cookie preferences when policy version is stale', () => {
      mockRequest.response = mockResponse
      isCookiePolicyVersionStale.mockReturnValue(true)

      onPreResponse(mockRequest, mockH)

      expect(clearCookiePreferences).toHaveBeenCalledWith(mockResponse)
    })

    test('shows cookie banner when policy version is stale', () => {
      mockRequest.response = mockResponse
      isCookiePolicyVersionStale.mockReturnValue(true)

      onPreResponse(mockRequest, mockH)

      expect(mockResponse.source.context.showCookieBanner).toBe(true)
    })

    test('does not clear cookies when policy version is current', () => {
      mockRequest.response = mockResponse

      onPreResponse(mockRequest, mockH)

      expect(clearCookiePreferences).not.toHaveBeenCalled()
    })
  })
})
