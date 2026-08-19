import { describe, it, expect, vi, beforeEach } from 'vitest'
import Jwt from '@hapi/jwt'

const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

vi.mock('../common/helpers/logging/logger.js', () => ({
  createLogger: () => mockLogger
}))

vi.mock('../auth/get-oidc-config.js', () => ({
  getOidcConfig: vi.fn()
}))

vi.mock('../auth/refresh-tokens.js', () => ({
  refreshTokens: vi.fn()
}))

vi.mock('../../config/config.js', () => ({
  config: {
    get: vi.fn()
  }
}))

const { defraIdentity, createUserSession } = await import('./defra-identity.js')
const { getOidcConfig } = await import('../auth/get-oidc-config.js')
const { refreshTokens } = await import('../auth/refresh-tokens.js')
const { config } = await import('../../config/config.js')

const mockGetOidcConfig = vi.mocked(getOidcConfig)
const mockRefreshTokens = vi.mocked(refreshTokens)

const oidcConfig = {
  authorization_endpoint: 'https://auth.example.com/authorize',
  token_endpoint: 'https://auth.example.com/token'
}

const defaultConfigValues = {
  'defraId.wellKnownUrl': 'https://auth.example.com/.well-known',
  'defraId.refreshTokens': true,
  'defraId.clientId': 'mock-client-id',
  'defraId.clientSecret': 'mock-client-secret',
  'cookie.password': 'mock-cookie-password',
  'cookie.isSecure': false,
  'defraId.redirectUrl': 'http://localhost:3000/signin-oidc'
}

const generateToken = (expiresInSec) => {
  const now = Math.floor(Date.now() / 1000)
  return Jwt.token.generate(
    { iat: now - 10, exp: now + expiresInSec },
    { key: 'test-secret' }
  )
}

const createMockServer = () => ({
  auth: {
    scheme: vi.fn(),
    strategy: vi.fn()
  },
  ext: vi.fn()
})

const createMockH = () => ({
  unauthenticated: vi.fn(() => 'unauthenticated'),
  authenticated: vi.fn(
    (opts) => `authenticated:${JSON.stringify(opts.credentials)}`
  )
})

describe('defra-identity plugin', () => {
  let sessionCache
  let server

  beforeEach(() => {
    config.get.mockImplementation((key) => defaultConfigValues[key])
    mockGetOidcConfig.mockResolvedValue(oidcConfig)

    sessionCache = {
      get: vi.fn(),
      set: vi.fn(),
      drop: vi.fn()
    }

    server = createMockServer()
  })

  const registerPlugin = async () => {
    await defraIdentity.plugin.register(server, { sessionCache })
  }

  const getAuthenticate = async () => {
    await registerPlugin()
    const yarSchemeCall = server.auth.scheme.mock.calls.find(
      ([name]) => name === 'yar-session'
    )
    const { authenticate } = yarSchemeCall[1](sessionCache)
    return authenticate
  }

  const createMockRequest = (sessionId) => ({
    yar: {
      get: vi.fn(() => sessionId),
      clear: vi.fn()
    }
  })

  describe('plugin registration', () => {
    it('fetches the OIDC configuration with a logger argument', async () => {
      await registerPlugin()

      expect(mockGetOidcConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          info: expect.any(Function),
          debug: expect.any(Function)
        })
      )
    })

    it('registers the yar-session scheme and both auth strategies', async () => {
      await registerPlugin()

      expect(server.auth.scheme).toHaveBeenCalledWith(
        'yar-session',
        expect.any(Function)
      )
      expect(server.auth.strategy).toHaveBeenCalledWith(
        'defra-id',
        'bell',
        expect.any(Object)
      )
      expect(server.auth.strategy).toHaveBeenCalledWith(
        'defra-session',
        'yar-session'
      )
    })

    it('configures the bell strategy from the OIDC configuration', async () => {
      await registerPlugin()

      const defraIdStrategy = server.auth.strategy.mock.calls.find(
        ([name]) => name === 'defra-id'
      )
      const bellOptions = defraIdStrategy[2]

      expect(bellOptions.provider.auth).toBe(oidcConfig.authorization_endpoint)
      expect(bellOptions.provider.token).toBe(oidcConfig.token_endpoint)
      expect(bellOptions.clientId).toBe('mock-client-id')
      expect(bellOptions.provider.scope).toEqual(['openid', 'offline_access'])
    })
  })

  describe('authenticate (yar-session scheme)', () => {
    it('returns unauthenticated when no session id is stored in Yar', async () => {
      const authenticate = await getAuthenticate()
      const request = createMockRequest(undefined)
      const h = createMockH()

      await authenticate(request, h)

      expect(h.unauthenticated).toHaveBeenCalledTimes(1)
    })

    it('drops the session and returns unauthenticated when the session is missing from cache', async () => {
      const authenticate = await getAuthenticate()
      sessionCache.get.mockResolvedValue(null)
      const request = createMockRequest('missing-session')
      const h = createMockH()

      await authenticate(request, h)

      expect(sessionCache.drop).toHaveBeenCalledWith('missing-session')
      expect(request.yar.clear).toHaveBeenCalledWith('sessionId')
      expect(h.unauthenticated).toHaveBeenCalledTimes(1)
    })

    it('authenticates without refreshing when the stored token is valid', async () => {
      const authenticate = await getAuthenticate()
      sessionCache.get.mockResolvedValue({
        token: generateToken(3600),
        refreshToken: 'refresh-token'
      })
      const request = createMockRequest('valid-session')
      const h = createMockH()

      await authenticate(request, h)

      expect(mockRefreshTokens).not.toHaveBeenCalled()
      expect(sessionCache.drop).not.toHaveBeenCalled()
      expect(h.authenticated).toHaveBeenCalledTimes(1)
    })

    it('refreshes and persists expired tokens before authenticating', async () => {
      const authenticate = await getAuthenticate()
      sessionCache.get.mockResolvedValue({
        token: generateToken(-3600), // expired 1 hour ago
        refreshToken: 'old-refresh-token'
      })
      mockRefreshTokens.mockResolvedValue({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token'
      })
      const request = createMockRequest('expired-session')
      const h = createMockH()

      await authenticate(request, h)

      expect(mockRefreshTokens).toHaveBeenCalledWith('old-refresh-token')
      expect(sessionCache.set).toHaveBeenCalledWith(
        'expired-session',
        expect.objectContaining({
          token: 'new-access-token',
          refreshToken: 'new-refresh-token'
        })
      )
      expect(sessionCache.drop).not.toHaveBeenCalled()
      expect(h.authenticated).toHaveBeenCalledTimes(1)
    })

    it('drops the session and returns unauthenticated when token refresh is disabled', async () => {
      config.get.mockImplementation((key) =>
        key === 'defraId.refreshTokens' ? false : defaultConfigValues[key]
      )
      const authenticate = await getAuthenticate()
      sessionCache.get.mockResolvedValue({
        token: generateToken(-3600),
        refreshToken: 'old-refresh-token'
      })
      const request = createMockRequest('disabled-session')
      const h = createMockH()

      await authenticate(request, h)

      expect(mockRefreshTokens).not.toHaveBeenCalled()
      expect(sessionCache.drop).toHaveBeenCalledWith('disabled-session')
      expect(request.yar.clear).toHaveBeenCalledWith('sessionId')
      expect(h.unauthenticated).toHaveBeenCalledTimes(1)
    })

    it('drops the session and returns unauthenticated when token refresh fails', async () => {
      const authenticate = await getAuthenticate()
      sessionCache.get.mockResolvedValue({
        token: generateToken(-3600),
        refreshToken: 'old-refresh-token'
      })
      mockRefreshTokens.mockRejectedValue(new Error('refresh failed'))
      const request = createMockRequest('failed-session')
      const h = createMockH()

      await authenticate(request, h)

      expect(sessionCache.set).not.toHaveBeenCalled()
      expect(sessionCache.drop).toHaveBeenCalledWith('failed-session')
      expect(request.yar.clear).toHaveBeenCalledWith('sessionId')
      expect(mockLogger.error).toHaveBeenCalled()
      expect(h.unauthenticated).toHaveBeenCalledTimes(1)
    })

    it('treats an unparseable token as invalid and refreshes it', async () => {
      const authenticate = await getAuthenticate()
      sessionCache.get.mockResolvedValue({
        token: 'not-a-valid-jwt',
        refreshToken: 'old-refresh-token'
      })
      mockRefreshTokens.mockResolvedValue({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token'
      })
      const request = createMockRequest('garbage-session')
      const h = createMockH()

      await authenticate(request, h)

      expect(mockRefreshTokens).toHaveBeenCalledWith('old-refresh-token')
      expect(h.authenticated).toHaveBeenCalledTimes(1)
    })
  })

  describe('createUserSession', () => {
    it('creates a session from OAuth credentials', () => {
      const profile = { sub: 'user-123' }
      const session = createUserSession({
        profile,
        token: 't',
        refreshToken: 'r'
      })

      expect(session).toEqual(
        expect.objectContaining({
          sessionId: expect.any(String),
          isAuthenticated: true,
          profile,
          token: 't',
          refreshToken: 'r',
          role: 'user',
          scope: []
        })
      )
    })
  })
})
