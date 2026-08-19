import { getSafeRedirect } from './get-safe-redirect.js'

const SIGN_IN_PATH = '/login'
const AUTH_ROUTES_PREFIX = '/auth/'

/**
 * Server-level onPreHandler extension that sends unauthenticated requests for
 * protected routes to the sign-in page, remembering the requested path in the
 * session so a successful login can redirect back to it.
 *
 * Registered by the DEFRA Identity plugin, so it only exists when auth is enabled.
 * Routes in 'try' mode handle their own unauthenticated requests and are skipped,
 * as are the service's own /auth/* endpoints (e.g. a signed-out request for
 * /auth/sign-out must not be bounced back to that URL after login). Only GET
 * requests are captured — redirecting a stored non-GET path back as a GET after
 * login would not resolve to the same handler.
 * @param {import('@hapi/hapi').Request} request - Hapi request object
 * @param {import('@hapi/hapi').Toolkit} h - Hapi response toolkit
 */
export function redirectToSignIn(request, h) {
  if (request.method !== 'get') {
    return h.continue
  }

  if (!request.route.settings.auth || request.auth.mode === 'try') {
    return h.continue
  }

  if (request.auth.credentials) {
    return h.continue
  }

  if (request.path.startsWith(AUTH_ROUTES_PREFIX)) {
    return h.continue
  }

  request.yar.set('redirectTo', getSafeRedirect(request.path))

  // Pre-handler lifecycle extensions may only continue, throw, or return a takeover response
  return h.redirect(SIGN_IN_PATH).takeover()
}
