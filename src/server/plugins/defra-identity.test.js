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

const { defraIdentity, createUserSession } = await import('./defra-identity.js')

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
    strategy: vi.fn(),
    default: vi.fn()
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

    it('tries the session strategy on every route so pages know who is signed in', async () => {
      await registerPlugin()

      expect(server.auth.default).toHaveBeenCalledWith({
        strategy: 'defra-session',
        mode: 'try'
      })
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

    it('authenticates when the stored token is valid', async () => {
      const authenticate = await getAuthenticate()
      sessionCache.get.mockResolvedValue({
        token: generateToken(3600),
        refreshToken: 'refresh-token'
      })
      const request = createMockRequest('valid-session')
      const h = createMockH()

      await authenticate(request, h)

      expect(sessionCache.drop).not.toHaveBeenCalled()
      expect(h.authenticated).toHaveBeenCalledTimes(1)
    })

    it.each([
      ['expired', generateToken(-3600)],
      ['unparseable', 'not-a-valid-jwt']
    ])(
      'drops the session and returns unauthenticated when the stored token is %s',
      async (_, token) => {
        const authenticate = await getAuthenticate()
        sessionCache.get.mockResolvedValue({ token })
        const request = createMockRequest('expired-session')
        const h = createMockH()

        await authenticate(request, h)

        expect(sessionCache.set).not.toHaveBeenCalled()
        expect(sessionCache.drop).toHaveBeenCalledWith('expired-session')
        expect(request.yar.clear).toHaveBeenCalledWith('sessionId')
        expect(h.unauthenticated).toHaveBeenCalledTimes(1)
      }
    )
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
