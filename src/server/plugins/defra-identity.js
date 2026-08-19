import Jwt from '@hapi/jwt'
import { createLogger } from '../common/helpers/logging/logger.js'
import { getOidcConfig } from '../auth/get-oidc-config.js'
import { refreshTokens } from '../auth/refresh-tokens.js'
import { redirectToSignIn } from '../auth/redirect-to-sign-in.js'
import { RETURN_PATH } from '../auth/auth-urls.js'
import { buildFrontendUrl } from '../common/helpers/build-frontend-url.js'
import { config } from '../../config/config.js'
import { randomUUID } from 'node:crypto'

const logger = createLogger()

/**
 * DEFRA Identity authentication plugin
 * Implements OAuth 2.0/OIDC authentication using Bell and Yar for session management
 * Based on the reference implementation: https://github.com/DEFRA/fcp-defra-id-example
 */
export const defraIdentity = {
  plugin: {
    name: 'defra-identity',
    async register(server, options) {
      const { sessionCache } = options

      logger.info('Registering DEFRA Identity authentication plugin')

      // Fetch OIDC configuration
      const oidcConfig = await getOidcConfig(logger)
      logger.info(
        `OIDC configuration loaded from ${config.get('defraId.baseUrl')}`
      )

      // Register custom session auth scheme that uses Yar
      server.auth.scheme('yar-session', yarSessionScheme(sessionCache))

      // Configure Bell strategy for DEFRA Identity OAuth
      server.auth.strategy('defra-id', 'bell', getBellOptions(oidcConfig))

      // Configure session strategy using our custom Yar-based scheme
      server.auth.strategy('defra-session', 'yar-session')

      server.ext('onPreHandler', redirectToSignIn)

      logger.info('DEFRA Identity authentication strategies registered')
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
    const { access_token: token, refresh_token: newRefreshToken } =
      await refreshTokens(userSession.refreshToken)

    userSession.token = token
    userSession.refreshToken = newRefreshToken

    await sessionCache.set(sessionId, userSession)
    logger.debug(`Token refreshed successfully for session ${sessionId}`)
    return true
  } catch (refreshError) {
    logger.error(refreshError, `Token refresh failed for session ${sessionId}`)
    return false
  }
}

/**
 * Creates Bell (OAuth 2.0) configuration
 * @param {Object} oidcConfig - OIDC discovery document
 * @returns {Object} Bell strategy options
 */
function getBellOptions(oidcConfig) {
  return {
    cookie: 'bell-defra-id', // Explicitly name Bell's temporary OAuth cookie
    provider: {
      name: 'defra-id',
      protocol: 'oauth2',
      useParamsAuth: true,
      auth: oidcConfig.authorization_endpoint,
      token: oidcConfig.token_endpoint,
      scope: ['openid', 'offline_access']
    },
    clientId: config.get('defraId.clientId'),
    clientSecret: config.get('defraId.clientSecret'),
    password: config.get('cookie.password'),
    isSecure: config.get('cookie.isSecure'),
    location: config.get('frontendBaseUrl'), // Browser-facing base URL
    config: {
      // Explicitly set the callback path to override Bell's default behavior
      redirectUri: buildFrontendUrl(RETURN_PATH)
    }
  }
}

/**
 * Creates a new user session from OAuth credentials
 * @param {Object} credentials - OAuth credentials from Bell
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
