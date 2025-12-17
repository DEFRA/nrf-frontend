import { createLogger } from '../common/helpers/logging/logger.js'
import { getSafeRedirect } from './get-safe-redirect.js'
import { createUserSession } from '../plugins/defra-identity.js'
import { config } from '../../config/config.js'

const logger = createLogger()

/**
 * Display login page
 */
export const loginController = {
  handler(request, h) {
    // Redirect authenticated users to home
    if (request.auth?.isAuthenticated) {
      return h.redirect('/')
    }

    const authEnabled = request.server.app.authEnabled || false

    return h.view('auth/login', {
      pageTitle: 'Sign in',
      heading: 'Sign in to continue',
      authEnabled
    })
  },
  options: {
    auth: false // Login page doesn't require authentication
  }
}

/**
 * Initiate OAuth flow - redirects to DEFRA Identity
 */
export const signInController = {
  async handler(request, h) {
    // Build the OAuth authorization URL manually to include serviceId and policy
    const { getOidcConfig } = await import('./get-oidc-config.js')
    const oidcConfig = await getOidcConfig()

    const authUrl = new URL(oidcConfig.authorization_endpoint)
    authUrl.searchParams.set('client_id', config.get('defraId.clientId'))
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('redirect_uri', config.get('defraId.redirectUrl'))
    authUrl.searchParams.set('scope', 'openid offline_access')
    authUrl.searchParams.set('serviceId', config.get('defraId.serviceId'))
    authUrl.searchParams.set('p', config.get('defraId.policy'))

    // Generate and store state for CSRF protection
    const crypto = await import('node:crypto')
    const state = crypto.randomBytes(16).toString('base64url')
    request.yar.set('oauth_state', state)
    authUrl.searchParams.set('state', state)

    return h.redirect(authUrl.toString())
  },
  options: {
    auth: false // No auth required - this just redirects
  }
}

/**
 * OAuth callback handler - completes authentication
 * Manually exchanges authorization code for tokens to avoid Bell's automatic redirect
 */
export const signInOidcController = {
  async handler(request, h) {
    // Check for OAuth errors
    if (request.query.error) {
      logger.error('OAuth error:', {
        error: request.query.error,
        description: request.query.error_description
      })
      return h.view('auth/login', {
        pageTitle: 'Sign in',
        heading: 'Authentication Error',
        authEnabled: true,
        error:
          request.query.error_description ||
          'Authentication failed. Please try again.'
      })
    }

    // Verify state parameter for CSRF protection
    const expectedState = request.yar.get('oauth_state')
    if (!expectedState || request.query.state !== expectedState) {
      logger.error('OAuth state mismatch')
      return h.view('auth/login', {
        pageTitle: 'Sign in',
        heading: 'Authentication Error',
        authEnabled: true,
        error: 'Invalid authentication state. Please try again.'
      })
    }
    request.yar.clear('oauth_state')

    // Check for authorization code
    if (!request.query.code) {
      logger.warn('OAuth callback received without authorization code')
      return h.redirect('/login')
    }

    try {
      // Exchange authorization code for tokens
      const { getOidcConfig } = await import('./get-oidc-config.js')
      const oidcConfig = await getOidcConfig()

      const { default: Wreck } = await import('@hapi/wreck')
      const { payload: tokenResponse } = await Wreck.post(
        oidcConfig.token_endpoint,
        {
          payload: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: config.get('defraId.clientId'),
            client_secret: config.get('defraId.clientSecret'),
            code: request.query.code,
            redirect_uri: config.get('defraId.redirectUrl')
          }).toString(),
          headers: {
            'content-type': 'application/x-www-form-urlencoded'
          },
          json: true
        }
      )

      // Decode and extract user profile from ID token
      const { default: Jwt } = await import('@hapi/jwt')
      const decoded = Jwt.token.decode(tokenResponse.id_token)

      // Create Bell-compatible credentials structure
      const credentials = {
        provider: 'defra-id',
        token: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresIn: tokenResponse.expires_in,
        query: request.query,
        profile: {
          id: decoded.decoded.payload.sub,
          email: decoded.decoded.payload.email,
          firstName: decoded.decoded.payload.given_name,
          lastName: decoded.decoded.payload.family_name,
          name: decoded.decoded.payload.name,
          crn:
            decoded.decoded.payload.contactId ||
            decoded.decoded.payload.uniqueReference,
          contactId: decoded.decoded.payload.contactId,
          uniqueReference: decoded.decoded.payload.uniqueReference,
          organisationId: decoded.decoded.payload.currentRelationshipId,
          currentRelationshipId: decoded.decoded.payload.currentRelationshipId,
          roles: decoded.decoded.payload.roles,
          serviceRoles: decoded.decoded.payload.serviceRoles
        }
      }

      // Create user session
      const userSession = createUserSession(credentials)

      // Store session in cache
      const sessionCache = request.server.app.sessionCache
      await sessionCache.set(userSession.sessionId, userSession)

      // Store session ID in Yar
      request.yar.set('sessionId', userSession.sessionId)

      logger.info(
        `User ${userSession.profile.email || userSession.profile.crn} authenticated successfully`
      )

      // Redirect to original path or home
      const redirect = request.yar.get('redirectTo') || '/'
      request.yar.clear('redirectTo')

      return h.redirect(getSafeRedirect(redirect))
    } catch (error) {
      logger.error('Token exchange failed:', error)
      return h.view('auth/login', {
        pageTitle: 'Sign in',
        heading: 'Authentication Error',
        authEnabled: true,
        error: 'Authentication failed during token exchange. Please try again.'
      })
    }
  },
  options: {
    auth: false // No authentication required - we handle OAuth manually
  }
}

/**
 * Sign out handler - clears local session and redirects to home
 */
export const signOutController = {
  async handler(request, h) {
    if (!request.auth.isAuthenticated || !request.auth.credentials) {
      return h.redirect('/')
    }

    const { sessionId } = request.auth.credentials

    // Clear session from cache
    const sessionCache = request.server.app.sessionCache
    await sessionCache.drop(sessionId)

    // Clear session ID from Yar
    request.yar.clear('sessionId')

    logger.info(`User session ${sessionId} signed out`)

    // Just redirect to home - no need to navigate to DEFRA Identity
    return h.redirect('/')
  },
  options: {
    auth: 'defra-session' // Requires active session
  }
}

/**
 * DEFRA Identity logout callback
 */
export const signOutOidcController = {
  async handler(request, h) {
    // Validate state parameter (CSRF protection)
    if (request.query.state) {
      try {
        const state = JSON.parse(
          Buffer.from(request.query.state, 'base64').toString()
        )
        logger.debug('Sign-out callback state validated:', state)
      } catch (error) {
        logger.warn('Invalid sign-out callback state:', error)
      }
    }

    // Failsafe: clear any remaining session
    const sessionId = request.yar.get('sessionId')
    if (sessionId) {
      const sessionCache = request.server.app.sessionCache
      await sessionCache.drop(sessionId)
      request.yar.clear('sessionId')
    }

    logger.info('Sign-out callback completed')
    return h.redirect('/')
  },
  options: {
    auth: false // No authentication required for logout callback
  }
}
