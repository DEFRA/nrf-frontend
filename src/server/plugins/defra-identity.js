import Jwt from '@hapi/jwt'
import { createLogger } from '../common/helpers/logging/logger.js'
import { redirectToSignIn } from '../auth/redirect-to-sign-in.js'
import { AUTH_STRATEGY_NAME } from '../auth/auth-urls.js'
import { randomUUID } from 'node:crypto'

const logger = createLogger()

/**
 * DEFRA Identity authentication plugin
 * Provides server-side session management via a custom Yar-based auth scheme.
 * The OAuth 2.0/OIDC sign-in handshake itself is hand-rolled in auth/controller.js,
 * which fetches the OIDC discovery document on demand (memoised).
 * Based on the reference implementation: https://github.com/DEFRA/fcp-defra-id-example
 */
export const defraIdentity = {
  plugin: {
    name: 'defra-identity',
    register(server, options) {
      const { sessionCache } = options

      logger.info('Registering DEFRA Identity authentication plugin')

      // Register custom session auth scheme that uses Yar
      server.auth.scheme('yar-session', yarSessionScheme(sessionCache))

      // Configure session strategy using our custom Yar-based scheme
      server.auth.strategy(AUTH_STRATEGY_NAME, 'yar-session')

      // 'try' so every page knows whether the user is signed in; routes that
      // must be protected opt in with rules: { requireAuth: true }
      server.auth.default({ strategy: AUTH_STRATEGY_NAME, mode: 'try' })

      server.ext('onPreHandler', redirectToSignIn)

      logger.info('DEFRA Identity authentication strategy registered')
    }
  }
}

/**
 * Custom authentication scheme that stores session data in Yar instead of cookies
 * @param {Object} sessionCache - Session cache instance
 * @returns {Function} Scheme function
 */
function yarSessionScheme(sessionCache) {
  return function () {
    return {
      authenticate: async function (request, h) {
        // Get session ID from Yar
        const sessionId = request.yar.get('sessionId')

        if (!sessionId) {
          return h.unauthenticated()
        }

        // Retrieve session from cache
        const userSession = await sessionCache.get(sessionId)

        if (!userSession) {
          logger.debug(`Session ${sessionId} not found in cache`)
          await sessionCache.drop(sessionId)
          request.yar.clear('sessionId')
          return h.unauthenticated()
        }

        // Tokens are not refreshed: once the access token expires the user signs in again
        if (!isTokenValid(userSession.token)) {
          await sessionCache.drop(sessionId)
          request.yar.clear('sessionId')
          return h.unauthenticated()
        }

        return h.authenticated({ credentials: userSession })
      },

      options: {
        payload: false
      }
    }
  }
}

/**
 * Returns true if the token decodes and is within its time validity window
 * (60 second skew).
 * @param {string} token - JWT to check
 * @returns {boolean}
 */
function isTokenValid(token) {
  try {
    const decoded = Jwt.token.decode(token)
    Jwt.token.verifyTime(decoded, { timeSkewSec: 60 })
    return true
  } catch (error) {
    logger.debug(`Stored token invalid or expired: ${error.message}`)
    return false
  }
}

/**
 * Creates a new user session from the OAuth token exchange credentials
 * @param {Object} credentials - Credentials built in auth/controller.js
 * @returns {Object} User session object
 */
export function createUserSession(credentials) {
  return {
    sessionId: randomUUID(),
    isAuthenticated: true,
    profile: credentials.profile,
    token: credentials.token,
    refreshToken: credentials.refreshToken,
    idToken: credentials.idToken,
    role: 'user',
    scope: []
  }
}
