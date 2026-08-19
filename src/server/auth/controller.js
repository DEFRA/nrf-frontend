import crypto from 'node:crypto'
import Jwt from '@hapi/jwt'
import { createLogger } from '../common/helpers/logging/logger.js'
import { getSafeRedirect } from './get-safe-redirect.js'
import { createUserSession } from '../plugins/defra-identity.js'
import { config } from '../../config/config.js'
import { getOidcConfig } from './get-oidc-config.js'
import { RETURN_PATH, SIGNED_OUT_PATH } from './auth-urls.js'
import { buildFrontendUrl } from '../common/helpers/build-frontend-url.js'
import { routePath as startPath } from '../manage/start-page/routes.js'

const logger = createLogger()

/**
 * Display login page
 */
export const loginController = {
  handler(request, h) {
    // Redirect authenticated users to home
    if (request.auth?.isAuthenticated) {
      return h.redirect(startPath)
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
    const oidcConfig = await getOidcConfig(logger)

    const authUrl = new URL(oidcConfig.authorization_endpoint)
    const scope = config.get('defraId.scopes').join(' ')
    authUrl.searchParams.set('client_id', config.get('defraId.clientId'))
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('redirect_uri', buildFrontendUrl(RETURN_PATH))
    authUrl.searchParams.set('scope', scope)
    authUrl.searchParams.set('serviceId', config.get('defraId.serviceId'))

    // Generate and store state for CSRF protection
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
      const oidcConfig = await getOidcConfig(logger)

      const scope = config.get('defraId.scopes').join(' ')
      const urlParams = {
        grant_type: 'authorization_code',
        client_id: config.get('defraId.clientId'),
        client_secret: config.get('defraId.clientSecret'),
        code: request.query.code,
        redirect_uri: buildFrontendUrl(RETURN_PATH),
        scope
      }
      const tokenRes = await fetch(oidcConfig.token_endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(urlParams).toString()
      })

      if (!tokenRes.ok) {
        throw new Error(
          `Token endpoint returned ${tokenRes.status} ${tokenRes.statusText}`
        )
      }

      const tokenResponse = await tokenRes.json()

      // Decode and extract user profile from ID token
      const decoded = Jwt.token.decode(tokenResponse.id_token)

      // Create Bell-compatible credentials structure
      const credentials = {
        provider: 'defra-id',
        token: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        idToken: tokenResponse.id_token,
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
      const redirect = request.yar.get('redirectTo') || startPath
      request.yar.clear('redirectTo')

      return h.redirect(getSafeRedirect(redirect))
    } catch (error) {
      logger.error(error, 'Token exchange failed')
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
 * Sign out handler - clears the local session then redirects the browser to the
 * Defra ID end_session_endpoint to sign out of B2C and any upstream IdPs.
 *
 * This is a top-level GET redirect rather than a form POST: B2C's sign-out
 * bounces through several origins (b2clogin.com, external IdPs) before returning
 * to post_logout_redirect_uri, and the CSP `form-action` directive is enforced
 * on every hop of a form submission — which would block that chain. A redirect
 * is not a form submission, so `form-action` does not apply. The id_token_hint
 * therefore rides in the query string (B2C supports GET sign-out).
 */
export const signOutController = {
  async handler(request, h) {
    if (!request.auth.isAuthenticated || !request.auth.credentials) {
      return h.redirect(startPath)
    }

    const { sessionId, idToken } = request.auth.credentials

    // Clear the local session before handing off to Defra ID
    const sessionCache = request.server.app.sessionCache
    await sessionCache.drop(sessionId)
    request.yar.clear('sessionId')

    const oidcConfig = await getOidcConfig(logger)
    const endSessionUrl = new URL(oidcConfig.end_session_endpoint)
    const postLogoutRedirectUri = buildFrontendUrl(SIGNED_OUT_PATH)
    const state = crypto.randomBytes(16).toString('base64url')
    request.yar.set('signout_state', state)
    endSessionUrl.searchParams.set('id_token_hint', idToken)
    endSessionUrl.searchParams.set(
      'post_logout_redirect_uri',
      postLogoutRedirectUri
    )
    endSessionUrl.searchParams.set('state', state)

    logger.info(`User session ${sessionId} signed out`)

    return h.redirect(endSessionUrl.toString())
  },
  options: {
    auth: 'defra-session' // Requires active session
  }
}

/**
 * DEFRA Identity logout callback - the post_logout_redirect_uri that B2C returns
 * to once sign-out completes. Verifies the state echoed through the provider
 * (a mismatch is logged but never blocks), then clears any residual session.
 */
export const signOutOidcController = {
  async handler(request, h) {
    const expectedState = request.yar.get('signout_state')
    request.yar.clear('signout_state')
    if (expectedState && request.query.state !== expectedState) {
      logger.warn('Sign-out state mismatch')
    }

    // Failsafe: clear any remaining session
    const sessionId = request.yar.get('sessionId')
    if (sessionId) {
      const sessionCache = request.server.app.sessionCache
      await sessionCache.drop(sessionId)
      request.yar.clear('sessionId')
    }

    logger.info('Sign-out callback completed')
    return h.redirect(startPath)
  },
  options: {
    auth: false // No authentication required for logout callback
  }
}
