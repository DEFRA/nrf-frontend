import { statusCodes } from '../common/constants/status-codes.js'
import { getSafeRedirect } from '../common/helpers/safe-redirect.js'
import { AUTH_SIGN_IN_PATH } from './auth-urls.js'

const AUTH_ROUTES_PREFIX = '/auth/'

/**
 * Server-level onPreHandler extension that sends unauthenticated requests for
 * protected routes straight to Defra ID sign-in, remembering the requested path in the
 * session so a successful login can redirect back to it.
 *
 * Registered by the DEFRA Identity plugin, so it only exists when auth is enabled.
 * Routes in 'try' mode handle their own unauthenticated requests and are skipped,
 * as are the service's own /auth/* endpoints (e.g. a signed-out request for
 * /auth/sign-out must not be bounced back to that URL after login). A POST (for
 * example a form submitted after the session expired) is also sent to sign-in and
 * returns to its own path as a GET, which only works when a GET route exists at
 * that path, so any other non-GET request carries on to the route's own handling.
 * @param {import('@hapi/hapi').Request} request - Hapi request object
 * @param {import('@hapi/hapi').Toolkit} h - Hapi response toolkit
 */
export function redirectToSignIn(request, h) {
  if (!request.route.settings.auth || request.auth.mode === 'try') {
    return h.continue
  }

  if (request.auth.credentials) {
    return h.continue
  }

  if (request.path.startsWith(AUTH_ROUTES_PREFIX)) {
    return h.continue
  }

  const isGet = request.method === 'get'
  if (!isGet && !request.server.match('get', request.path)) {
    return h.continue
  }

  request.yar.set('redirectTo', getSafeRedirect(request.path))

  // Pre-handler lifecycle extensions may only continue, throw, or return a takeover response
  const redirect = h.redirect(AUTH_SIGN_IN_PATH)
  return (
    isGet ? redirect : redirect.code(statusCodes.redirectAfterPost)
  ).takeover()
}
