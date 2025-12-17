import Jwt from '@hapi/jwt'
import { createLogger } from '../common/helpers/logging/logger.js'
import { getOidcConfig } from '../auth/get-oidc-config.js'
import { refreshTokens } from '../auth/refresh-tokens.js'
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
      const oidcConfig = await getOidcConfig()
      logger.info(
        `OIDC configuration loaded from ${config.get('defraId.wellKnownUrl')}`
      )

      // Register custom session auth scheme that uses Yar
      server.auth.scheme('yar-session', yarSessionScheme(sessionCache))

      // Configure Bell strategy for DEFRA Identity OAuth
      server.auth.strategy('defra-id', 'bell', getBellOptions(oidcConfig))

      // Configure session strategy using our custom Yar-based scheme
      server.auth.strategy('defra-session', 'yar-session')

      // Set defra-session as the default strategy for all routes
      server.auth.default('defra-session')

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

        // Verify token expiration
        try {
          const decoded = Jwt.token.decode(userSession.token)
          Jwt.token.verifyTime(decoded, { timeSkewSec: 60 })
        } catch (error) {
          logger.debug(
            `Token expired for session ${sessionId}, attempting refresh`
          )

          // Attempt token refresh if enabled
          if (!config.get('defraId.refreshTokens')) {
            logger.debug('Token refresh disabled, invalidating session')
            await sessionCache.drop(sessionId)
            request.yar.clear('sessionId')
            return h.unauthenticated()
          }

          try {
            const { access_token: token, refresh_token: newRefreshToken } =
              await refreshTokens(userSession.refreshToken)

            userSession.token = token
            userSession.refreshToken = newRefreshToken

            await sessionCache.set(sessionId, userSession)
            logger.debug(
              `Token refreshed successfully for session ${sessionId}`
            )
          } catch (refreshError) {
            logger.error(
              `Token refresh failed for session ${sessionId}:`,
              refreshError
            )
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
    location: new URL(config.get('defraId.redirectUrl')).origin, // Base URL derived from redirect URL
    config: {
      // Explicitly set the callback path to override Bell's default behavior
      redirectUri: config.get('defraId.redirectUrl')
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
    role: 'user',
    scope: []
  }
}
