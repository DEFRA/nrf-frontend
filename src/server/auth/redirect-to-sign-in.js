import { statusCodes } from '../common/constants/status-codes.js'
import { getSafeRedirect } from '../common/helpers/safe-redirect.js'
import { AUTH_SIGN_IN_PATH } from './auth-urls.js'

const AUTH_ROUTES_PREFIX = '/auth/'

/**
 * Sends a signed-out request for a protected page to Defra ID sign-in, and
 * remembers the page's path so the user comes back to it afterwards.
 *
 * A POST is handled the same way, for example a form submitted after the
 * session expired. The user returns to the page with a GET and the form is not
 * saved. This needs a GET page at the same path, so any other non-GET request
 * is left to its route.
 *
 * Skipped: routes in 'try' mode, and the service's own /auth/* endpoints (a
 * signed-out request for /auth/sign-out must not be sent back to it after login).
 * Only registered when auth is enabled, by the DEFRA Identity plugin.
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
