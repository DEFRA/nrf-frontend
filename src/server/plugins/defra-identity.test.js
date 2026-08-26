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

vi.mock('../auth/refresh-tokens.js', () => ({
  refreshTokens: vi.fn()
}))

vi.mock('../auth/sync-user-to-backend.js', () => ({
  syncUserToBackend: vi.fn()
}))

vi.mock('../../config/config.js', () => ({
  config: {
    get: vi.fn()
  }
}))

const { defraIdentity, createUserSession } = await import('./defra-identity.js')
const { refreshTokens } = await import('../auth/refresh-tokens.js')
const { syncUserToBackend } = await import('../auth/sync-user-to-backend.js')
const { config } = await import('../../config/config.js')

const mockRefreshTokens = vi.mocked(refreshTokens)
const mockSyncUserToBackend = vi.mocked(syncUserToBackend)

const defaultConfigValues = {
  'defraId.refreshTokens': true
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

    sessionCache = {
      get: vi.fn(),
      set: vi.fn(),
      drop: vi.fn()
    }

    server = createMockServer()

    mockSyncUserToBackend.mockResolvedValue(undefined)
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
    it('registers the yar-session scheme and the defra-session strategy', async () => {
      await registerPlugin()

      expect(server.auth.scheme).toHaveBeenCalledWith(
        'yar-session',
        expect.any(Function)
      )
      expect(server.auth.strategy).toHaveBeenCalledWith(
        'defra-session',
        'yar-session'
      )
    })

    it('does not register a Bell (defra-id) strategy or fetch OIDC config at boot', async () => {
      await registerPlugin()

      const registeredStrategies = server.auth.strategy.mock.calls.map(
        ([name]) => name
      )
      expect(registeredStrategies).not.toContain('defra-id')
    })

    it('registers the redirect-to-sign-in pre-handler extension', async () => {
      await registerPlugin()

      expect(server.ext).toHaveBeenCalledWith(
        'onPreHandler',
        expect.any(Function)
      )
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
        refresh_token: 'new-refresh-token',
        id_token: 'new-id-token'
      })
      const request = createMockRequest('expired-session')
      const h = createMockH()

      await authenticate(request, h)

      expect(mockRefreshTokens).toHaveBeenCalledWith('old-refresh-token')
      expect(sessionCache.set).toHaveBeenCalledWith(
        'expired-session',
        expect.objectContaining({
          token: 'new-access-token',
          refreshToken: 'new-refresh-token',
          idToken: 'new-id-token'
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

    it('syncs the user profile to nrf-backend on an unsaved session', async () => {
      const authenticate = await getAuthenticate()
      const userSession = {
        sessionId: 'valid-session',
        token: generateToken(3600),
        refreshToken: 'refresh-token',
        profile: { id: 'user-123' }
      }
      sessionCache.get.mockResolvedValue(userSession)
      const request = createMockRequest('valid-session')
      const h = createMockH()

      await authenticate(request, h)

      expect(mockSyncUserToBackend).toHaveBeenCalledWith({
        userSession,
        sessionCache
      })
    })

    it('does not sync a session that has already been saved', async () => {
      const authenticate = await getAuthenticate()
      sessionCache.get.mockResolvedValue({
        sessionId: 'saved-session',
        token: generateToken(3600),
        refreshToken: 'refresh-token',
        profile: { id: 'user-123' },
        userSaved: true
      })
      const request = createMockRequest('saved-session')
      const h = createMockH()

      await authenticate(request, h)

      expect(mockSyncUserToBackend).not.toHaveBeenCalled()
    })
  })

  describe('createUserSession', () => {
    it('creates a session from OAuth credentials', () => {
      const profile = { sub: 'user-123' }
      const session = createUserSession({
        profile,
        token: 't',
        refreshToken: 'r',
        idToken: 'id'
      })

      expect(session).toEqual(
        expect.objectContaining({
          sessionId: expect.any(String),
          isAuthenticated: true,
          profile,
          token: 't',
          refreshToken: 'r',
          idToken: 'id',
          role: 'user',
          scope: []
        })
      )
    })
  })
})
