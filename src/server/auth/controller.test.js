import {
  loginController,
  signInController,
  signInOidcController,
  signOutController,
  signOutOidcController
} from './controller.js'
import Wreck from '@hapi/wreck'
import Jwt from '@hapi/jwt'
import { getOidcConfig } from './get-oidc-config.js'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@hapi/wreck', () => ({
  default: {
    post: vi.fn()
  }
}))

vi.mock('./get-oidc-config.js', () => ({
  getOidcConfig: vi.fn(() => ({
    token_endpoint: 'https://auth.example.com/token'
  }))
}))

vi.mock('../common/helpers/logging/logger.js', () => ({
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  })
}))

vi.mock('./get-safe-redirect.js', () => ({
  getSafeRedirect: vi.fn((path) => path)
}))

vi.mock('../plugins/defra-identity.js', () => ({
  createUserSession: vi.fn((credentials) => ({
    sessionId: 'mock-session-id',
    profile: credentials.profile
  }))
}))

vi.mock('../../config/config.js', () => ({
  config: {
    get: vi.fn((key) => {
      const config = {
        'defraId.scopes': ['openid', 'profile', 'email'],
        'defraId.clientId': 'mock-client-id',
        'defraId.clientSecret': 'mock-client-secret',
        'defraId.redirectUrl': 'http://localhost:3000/signin-oidc',
        'defraId.serviceId': 'mock-service-id'
      }
      return config[key]
    })
  }
}))

const mockWreck = vi.mocked(Wreck)
const mockGetOidcConfig = vi.mocked(getOidcConfig)

describe('Auth Controllers', () => {
  describe('loginController', () => {
    it('should render login page', () => {
      const request = {
        server: {
          app: {
            authEnabled: true
          }
        }
      }
      const h = {
        view: (template, context) => ({ template, context })
      }

      const result = loginController.handler(request, h)

      expect(result.template).toBe('auth/login')
      expect(result.context.pageTitle).toBe('Sign in')
      expect(result.context.heading).toBe('Sign in to continue')
    })

    it('should redirect authenticated users to home', () => {
      const request = {
        auth: {
          isAuthenticated: true
        },
        server: {
          app: {
            authEnabled: true
          }
        }
      }
      const h = {
        redirect: vi.fn((url) => ({ redirect: url }))
      }

      loginController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith('/')
    })
  })

  describe('signInController', () => {
    it('should redirect to OAuth authorization URL with correct parameters', async () => {
      mockGetOidcConfig.mockResolvedValue({
        authorization_endpoint: 'https://auth.example.com/authorize'
      })

      const request = {
        yar: {
          set: vi.fn()
        }
      }
      const h = {
        redirect: vi.fn((url) => ({ redirect: url }))
      }

      await signInController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledTimes(1)
      const redirectUrl = h.redirect.mock.calls[0][0]
      const url = new URL(redirectUrl)

      // Verify base URL
      expect(url.origin + url.pathname).toBe(
        'https://auth.example.com/authorize'
      )

      // Verify all required OAuth parameters
      expect(url.searchParams.get('client_id')).toBe('mock-client-id')
      expect(url.searchParams.get('response_type')).toBe('code')
      expect(url.searchParams.get('redirect_uri')).toBe(
        'http://localhost:3000/signin-oidc'
      )
      expect(url.searchParams.get('scope')).toBe('openid profile email')
      expect(url.searchParams.get('serviceId')).toBe('mock-service-id')
    })

    it('should generate and store state token for CSRF protection', async () => {
      mockGetOidcConfig.mockResolvedValue({
        authorization_endpoint: 'https://auth.example.com/authorize'
      })

      const request = {
        yar: {
          set: vi.fn()
        }
      }
      const h = {
        redirect: vi.fn((url) => ({ redirect: url }))
      }

      await signInController.handler(request, h)

      // Verify state was stored in Yar
      expect(request.yar.set).toHaveBeenCalledWith(
        'oauth_state',
        expect.any(String)
      )

      const storedState = request.yar.set.mock.calls[0][1]

      // Verify state is in the redirect URL
      const redirectUrl = h.redirect.mock.calls[0][0]
      const url = new URL(redirectUrl)
      expect(url.searchParams.get('state')).toBe(storedState)

      // Verify state is a non-empty string (crypto.randomBytes should generate it)
      expect(storedState).toBeTruthy()
      expect(typeof storedState).toBe('string')
      expect(storedState.length).toBeGreaterThan(0)
    })
  })

  describe('signInOidcController', () => {
    let request
    let h
    let mockSessionCache

    beforeEach(() => {
      mockSessionCache = {
        set: vi.fn(),
        drop: vi.fn()
      }

      request = {
        query: {},
        yar: {
          get: vi.fn(),
          set: vi.fn(),
          clear: vi.fn()
        },
        server: {
          app: {
            sessionCache: mockSessionCache
          }
        }
      }

      h = {
        view: vi.fn((template, context) => ({ template, context })),
        redirect: vi.fn((url) => ({ redirect: url }))
      }
    })

    it('should render error view when OAuth error is present', async () => {
      request.query.error = 'access_denied'
      request.query.error_description = 'User denied access'

      await signInOidcController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith('auth/login', {
        pageTitle: 'Sign in',
        heading: 'Authentication Error',
        authEnabled: true,
        error: 'User denied access'
      })
    })

    it('should render error view with default message when OAuth error has no description', async () => {
      request.query.error = 'server_error'

      await signInOidcController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith('auth/login', {
        pageTitle: 'Sign in',
        heading: 'Authentication Error',
        authEnabled: true,
        error: 'Authentication failed. Please try again.'
      })
    })

    it('should render error view when state parameter is missing', async () => {
      request.query.code = 'auth-code'
      request.yar.get.mockReturnValue('expected-state')
      request.query.state = undefined

      await signInOidcController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith('auth/login', {
        pageTitle: 'Sign in',
        heading: 'Authentication Error',
        authEnabled: true,
        error: 'Invalid authentication state. Please try again.'
      })
    })

    it('should render error view when state parameter does not match', async () => {
      request.query.code = 'auth-code'
      request.query.state = 'wrong-state'
      request.yar.get.mockReturnValue('expected-state')

      await signInOidcController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith('auth/login', {
        pageTitle: 'Sign in',
        heading: 'Authentication Error',
        authEnabled: true,
        error: 'Invalid authentication state. Please try again.'
      })
    })

    it('should redirect to login when authorization code is missing', async () => {
      request.query.state = 'matching-state'
      request.yar.get.mockReturnValue('matching-state')
      // No code in query

      await signInOidcController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith('/login')
    })

    it('should render error view when token exchange fails', async () => {
      request.query.code = 'auth-code'
      request.query.state = 'matching-state'
      request.yar.get.mockReturnValue('matching-state')

      mockWreck.post.mockRejectedValue(new Error('Token exchange failed'))

      await signInOidcController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith('auth/login', {
        pageTitle: 'Sign in',
        heading: 'Authentication Error',
        authEnabled: true,
        error: 'Authentication failed during token exchange. Please try again.'
      })
    })

    it('should successfully complete authentication flow', async () => {
      request.query.code = 'auth-code'
      request.query.state = 'matching-state'
      request.yar.get
        .mockReturnValueOnce('matching-state') // oauth_state
        .mockReturnValueOnce('/dashboard') // redirectTo

      const userPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        given_name: 'Test',
        family_name: 'User',
        name: 'Test User',
        contactId: 'contact-123',
        uniqueReference: 'ref-123',
        currentRelationshipId: 'rel-123',
        roles: ['user'],
        serviceRoles: ['service-user']
      }
      const idToken = Jwt.token.generate(userPayload, { key: 'test-secret' })

      mockWreck.post.mockResolvedValue({
        payload: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          id_token: idToken,
          expires_in: 3600
        }
      })

      await signInOidcController.handler(request, h)

      // Verify oauth_state is cleared (CSRF cleanup)
      expect(request.yar.clear).toHaveBeenCalledWith('oauth_state')

      // Verify session is created and stored
      expect(mockSessionCache.set).toHaveBeenCalledWith(
        'mock-session-id',
        expect.objectContaining({
          sessionId: 'mock-session-id'
        })
      )

      // Verify session ID is stored in Yar
      expect(request.yar.set).toHaveBeenCalledWith(
        'sessionId',
        'mock-session-id'
      )

      // Verify redirect state is cleared and user is redirected
      expect(request.yar.clear).toHaveBeenCalledWith('redirectTo')
      expect(h.redirect).toHaveBeenCalledWith('/dashboard')
    })
  })

  describe('signOutController', () => {
    it('should redirect to home when user is not authenticated', async () => {
      const request = {
        auth: {
          isAuthenticated: false
        }
      }
      const h = {
        redirect: vi.fn((url) => ({ redirect: url }))
      }

      await signOutController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith('/')
    })

    it('should redirect to home when credentials are missing', async () => {
      const request = {
        auth: {
          isAuthenticated: true,
          credentials: null
        }
      }
      const h = {
        redirect: vi.fn((url) => ({ redirect: url }))
      }

      await signOutController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith('/')
    })

    it('should clear session and redirect to home', async () => {
      const mockSessionCache = {
        drop: vi.fn()
      }

      const request = {
        auth: {
          isAuthenticated: true,
          credentials: {
            sessionId: 'test-session-id'
          }
        },
        yar: {
          clear: vi.fn()
        },
        server: {
          app: {
            sessionCache: mockSessionCache
          }
        }
      }
      const h = {
        redirect: vi.fn((url) => ({ redirect: url }))
      }

      await signOutController.handler(request, h)

      // Verify session is dropped from cache
      expect(mockSessionCache.drop).toHaveBeenCalledWith('test-session-id')

      // Verify sessionId is cleared from Yar
      expect(request.yar.clear).toHaveBeenCalledWith('sessionId')

      // Verify redirect to home
      expect(h.redirect).toHaveBeenCalledWith('/')
    })
  })

  describe('signOutOidcController', () => {
    it('should handle sign-out callback with valid state', async () => {
      const state = Buffer.from(JSON.stringify({ foo: 'bar' })).toString(
        'base64'
      )

      const request = {
        query: {
          state
        },
        yar: {
          get: vi.fn().mockReturnValue(null),
          clear: vi.fn()
        }
      }
      const h = {
        redirect: vi.fn((url) => ({ redirect: url }))
      }

      await signOutOidcController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith('/')
    })

    it('should handle sign-out callback with invalid state', async () => {
      const request = {
        query: {
          state: 'invalid-base64'
        },
        yar: {
          get: vi.fn().mockReturnValue(null),
          clear: vi.fn()
        }
      }
      const h = {
        redirect: vi.fn((url) => ({ redirect: url }))
      }

      await signOutOidcController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith('/')
    })

    it('should handle sign-out callback without state', async () => {
      const request = {
        query: {},
        yar: {
          get: vi.fn().mockReturnValue(null),
          clear: vi.fn()
        }
      }
      const h = {
        redirect: vi.fn((url) => ({ redirect: url }))
      }

      await signOutOidcController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith('/')
    })

    it('should clear remaining session if present', async () => {
      const mockSessionCache = {
        drop: vi.fn()
      }

      const request = {
        query: {},
        yar: {
          get: vi.fn().mockReturnValue('remaining-session-id'),
          clear: vi.fn()
        },
        server: {
          app: {
            sessionCache: mockSessionCache
          }
        }
      }
      const h = {
        redirect: vi.fn((url) => ({ redirect: url }))
      }

      await signOutOidcController.handler(request, h)

      // Verify remaining session is dropped
      expect(mockSessionCache.drop).toHaveBeenCalledWith('remaining-session-id')

      // Verify sessionId is cleared
      expect(request.yar.clear).toHaveBeenCalledWith('sessionId')

      // Verify redirect to home
      expect(h.redirect).toHaveBeenCalledWith('/')
    })
  })
})
