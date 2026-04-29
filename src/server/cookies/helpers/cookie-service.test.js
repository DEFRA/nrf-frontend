import { vi } from 'vitest'
import {
  createCookiePolicy,
  setCookiePreferences,
  areAnalyticsCookiesAccepted,
  clearCookiePreferences,
  getCookiePreferences,
  isCookiePolicyVersionStale
} from './cookie-service.js'
import { COOKIE_NAMES, COOKIE_OPTIONS } from './constants.js'
import { COOKIE_POLICY_VERSION } from './version.js'
import { config } from '../../../config/config.js'

vi.mock('../../../config/config.js')

const createMockResponse = () => ({
  state: vi.fn().mockReturnThis(),
  unstate: vi.fn().mockReturnThis()
})

const createMockRequest = (state) => ({ state })

const createMockRequestWithPolicy = (policy) =>
  createMockRequest({ cookies_policy: JSON.stringify(policy) })

describe('cookie-service', () => {
  let mockResponse

  beforeEach(() => {
    mockResponse = createMockResponse()
    vi.spyOn(Date, 'now').mockReturnValue(1234567890000)
    config.get.mockReturnValue(false)
  })

  afterEach(() => {
    Date.now.mockRestore()
  })

  describe('createCookiePolicy', () => {
    test('returns a JSON string with analytics enabled', () => {
      expect(JSON.parse(createCookiePolicy(true))).toEqual({
        essential: true,
        analytics: true,
        version: COOKIE_POLICY_VERSION,
        timestamp: 1234567890
      })
    })

    test('returns a JSON string with analytics disabled', () => {
      expect(JSON.parse(createCookiePolicy(false))).toEqual({
        essential: true,
        analytics: false,
        version: COOKIE_POLICY_VERSION,
        timestamp: 1234567890
      })
    })

    test('uses Unix seconds for the timestamp', () => {
      Date.now.mockReturnValue(1634567890123)
      expect(JSON.parse(createCookiePolicy(true)).timestamp).toBe(1634567890)
    })

    test('embeds the current cookie policy version', () => {
      expect(JSON.parse(createCookiePolicy(true)).version).toBe(
        COOKIE_POLICY_VERSION
      )
    })
  })

  describe('setCookiePreferences', () => {
    test('sets policy and preferences-set cookies in development', () => {
      setCookiePreferences(mockResponse, true)

      expect(mockResponse.state).toHaveBeenCalledTimes(2)
      expect(mockResponse.state).toHaveBeenCalledWith(
        COOKIE_NAMES.POLICY,
        JSON.stringify({
          essential: true,
          analytics: true,
          version: COOKIE_POLICY_VERSION,
          timestamp: 1234567890
        }),
        {
          ttl: COOKIE_OPTIONS.TTL,
          path: COOKIE_OPTIONS.PATH,
          isSecure: false,
          isSameSite: COOKIE_OPTIONS.IS_SAME_SITE
        }
      )
      expect(mockResponse.state).toHaveBeenCalledWith(
        COOKIE_NAMES.PREFERENCES_SET,
        'true',
        {
          ttl: COOKIE_OPTIONS.TTL,
          path: COOKIE_OPTIONS.PATH,
          isSecure: false,
          isSameSite: COOKIE_OPTIONS.IS_SAME_SITE
        }
      )
    })

    test('sets isSecure when in production', () => {
      config.get.mockReturnValue(true)

      setCookiePreferences(mockResponse, false)

      expect(mockResponse.state).toHaveBeenCalledWith(
        COOKIE_NAMES.POLICY,
        expect.any(String),
        expect.objectContaining({ isSecure: true })
      )
      expect(mockResponse.state).toHaveBeenCalledWith(
        COOKIE_NAMES.PREFERENCES_SET,
        'true',
        expect.objectContaining({ isSecure: true })
      )
    })

    test('persists analytics=false in the policy cookie', () => {
      setCookiePreferences(mockResponse, false)

      expect(mockResponse.state).toHaveBeenCalledWith(
        COOKIE_NAMES.POLICY,
        JSON.stringify({
          essential: true,
          analytics: false,
          version: COOKIE_POLICY_VERSION,
          timestamp: 1234567890
        }),
        expect.any(Object)
      )
    })
  })

  describe('getCookiePreferences', () => {
    const defaultPreferences = {
      essential: true,
      analytics: null,
      version: null,
      timestamp: null
    }

    test('returns parsed policy when cookies_policy cookie exists', () => {
      const policy = {
        essential: true,
        analytics: true,
        version: COOKIE_POLICY_VERSION,
        timestamp: 1234567890
      }

      expect(getCookiePreferences(createMockRequestWithPolicy(policy))).toEqual(
        policy
      )
    })

    test('returns default preferences when cookies_policy is absent', () => {
      expect(getCookiePreferences(createMockRequest({}))).toEqual(
        defaultPreferences
      )
    })

    test('returns default preferences when request has no state', () => {
      expect(getCookiePreferences({})).toEqual(defaultPreferences)
    })

    test('preserves additional properties on the policy', () => {
      const policy = {
        essential: true,
        analytics: false,
        version: COOKIE_POLICY_VERSION,
        timestamp: 1,
        extra: 'value'
      }

      expect(getCookiePreferences(createMockRequestWithPolicy(policy))).toEqual(
        policy
      )
    })

    test('returns default preferences when policy version is older', () => {
      const policy = {
        essential: true,
        analytics: true,
        version: COOKIE_POLICY_VERSION - 1,
        timestamp: 1
      }

      expect(getCookiePreferences(createMockRequestWithPolicy(policy))).toEqual(
        defaultPreferences
      )
    })

    test('returns default preferences when policy has no version', () => {
      const policy = { essential: true, analytics: true, timestamp: 1 }

      expect(getCookiePreferences(createMockRequestWithPolicy(policy))).toEqual(
        defaultPreferences
      )
    })

    test('returns default preferences when cookies_policy is invalid JSON', () => {
      const request = createMockRequest({ cookies_policy: 'not-json{' })

      expect(getCookiePreferences(request)).toEqual(defaultPreferences)
    })

    test('returns default preferences when cookies_policy is a JSON string (not an object)', () => {
      const request = createMockRequest({
        cookies_policy: JSON.stringify('a string')
      })

      expect(getCookiePreferences(request)).toEqual(defaultPreferences)
    })

    test('returns default preferences when cookies_policy is a JSON array', () => {
      const request = createMockRequest({ cookies_policy: JSON.stringify([]) })

      expect(getCookiePreferences(request)).toEqual(defaultPreferences)
    })

    test('returns default preferences when required fields have wrong types', () => {
      const policy = {
        essential: 'yes',
        analytics: 'yes',
        version: '1',
        timestamp: '123'
      }

      expect(
        getCookiePreferences(
          createMockRequest({ cookies_policy: JSON.stringify(policy) })
        )
      ).toEqual(defaultPreferences)
    })

    test.each([
      { version: 0, timestamp: 1 },
      { version: -1, timestamp: 1 },
      { version: 1.5, timestamp: 1 },
      { version: 1, timestamp: 0 },
      { version: 1, timestamp: -1 },
      { version: 1, timestamp: 1.5 }
    ])(
      'returns default preferences when version=$version timestamp=$timestamp',
      ({ version, timestamp }) => {
        const policy = { essential: true, analytics: true, version, timestamp }

        expect(
          getCookiePreferences(
            createMockRequest({ cookies_policy: JSON.stringify(policy) })
          )
        ).toEqual(defaultPreferences)
      }
    )
  })

  describe('isCookiePolicyVersionStale', () => {
    test('returns false when no policy cookie is present', () => {
      expect(isCookiePolicyVersionStale(createMockRequest({}))).toBe(false)
    })

    test('returns false when policy version matches', () => {
      const request = createMockRequestWithPolicy({
        essential: true,
        analytics: true,
        version: COOKIE_POLICY_VERSION,
        timestamp: 1
      })

      expect(isCookiePolicyVersionStale(request)).toBe(false)
    })

    test('returns true when policy version is different', () => {
      const request = createMockRequestWithPolicy({
        essential: true,
        analytics: true,
        version: COOKIE_POLICY_VERSION - 1,
        timestamp: 1
      })

      expect(isCookiePolicyVersionStale(request)).toBe(true)
    })

    test('returns true when policy has no version', () => {
      const request = createMockRequestWithPolicy({
        essential: true,
        analytics: true,
        timestamp: 1
      })

      expect(isCookiePolicyVersionStale(request)).toBe(true)
    })
  })

  describe('clearCookiePreferences', () => {
    test('unsets both the policy and preferences-set cookies', () => {
      clearCookiePreferences(mockResponse)

      expect(mockResponse.unstate).toHaveBeenCalledWith(COOKIE_NAMES.POLICY, {
        path: COOKIE_OPTIONS.PATH
      })
      expect(mockResponse.unstate).toHaveBeenCalledWith(
        COOKIE_NAMES.PREFERENCES_SET,
        { path: COOKIE_OPTIONS.PATH }
      )
    })
  })

  describe('areAnalyticsCookiesAccepted', () => {
    test('returns true when analytics is true', () => {
      const request = createMockRequestWithPolicy({
        essential: true,
        analytics: true,
        version: COOKIE_POLICY_VERSION,
        timestamp: 1
      })

      expect(areAnalyticsCookiesAccepted(request)).toBe(true)
    })

    test('returns false when analytics is false', () => {
      const request = createMockRequestWithPolicy({
        essential: true,
        analytics: false,
        version: COOKIE_POLICY_VERSION,
        timestamp: 1
      })

      expect(areAnalyticsCookiesAccepted(request)).toBe(false)
    })

    test('returns false when no cookies_policy cookie exists', () => {
      expect(areAnalyticsCookiesAccepted(createMockRequest({}))).toBe(false)
    })

    test('returns false when policy version is stale', () => {
      const request = createMockRequestWithPolicy({
        essential: true,
        analytics: true,
        version: COOKIE_POLICY_VERSION - 1,
        timestamp: 1
      })

      expect(areAnalyticsCookiesAccepted(request)).toBe(false)
    })
  })
})
