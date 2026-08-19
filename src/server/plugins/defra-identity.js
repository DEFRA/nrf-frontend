import Jwt from '@hapi/jwt'
import { createLogger } from '../common/helpers/logging/logger.js'
import { refreshTokens } from '../auth/refresh-tokens.js'
import { redirectToSignIn } from '../auth/redirect-to-sign-in.js'
import { config } from '../../config/config.js'
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
      server.auth.strategy('defra-session', 'yar-session')

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

        // Refresh the stored token if it is invalid or expired
        if (!isTokenValid(userSession.token)) {
          const refreshed = await refreshUserSession({
            sessionId,
            userSession,
            sessionCache
          })

          if (!refreshed) {
            await sessionCache.drop(sessionId)
            request.yar.clear('sessionId')
            return h.unauthenticated()
          }
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
 * Refreshes a session's expired access token and persists the new tokens.
 * Mutates userSession in place on success.
 * @param {Object} params - Refresh parameters
 * @param {string} params.sessionId - Session identifier, used in log messages
 * @param {Object} params.userSession - User session object with token and refreshToken properties
 * @param {Object} params.sessionCache - Session cache instance used to persist the updated session
 * @returns {Promise<boolean>} True if the tokens were refreshed, false if refresh is disabled or failed
 */
async function refreshUserSession({ sessionId, userSession, sessionCache }) {
  if (!config.get('defraId.refreshTokens')) {
    logger.debug(`Token refresh disabled for session ${sessionId}`)
    return false
  }

  try {
    const {
      access_token: token,
      refresh_token: newRefreshToken,
      id_token: newIdToken
    } = await refreshTokens(userSession.refreshToken)

    userSession.token = token
    userSession.refreshToken = newRefreshToken
    if (newIdToken) {
      userSession.idToken = newIdToken
    }

    await sessionCache.set(sessionId, userSession)
    logger.debug(`Token refreshed successfully for session ${sessionId}`)
    return true
  } catch (refreshError) {
    logger.error(refreshError, `Token refresh failed for session ${sessionId}`)
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
