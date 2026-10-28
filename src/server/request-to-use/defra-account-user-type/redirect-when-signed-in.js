import { statusCodes } from '../../common/constants/status-codes.js'
import { routePath as enterAddressPath } from '../enter-address/route-path.js'

/**
 * Route pre-handler: skips the page for users already signed in to Defra ID.
 * Checks credentials because `request.auth.isAuthenticated` is also true for
 * an unauthenticated request on a route in try mode.
 * @param {import('@hapi/hapi').Request} request
 * @param {import('@hapi/hapi').ResponseToolkit} h
 * @returns {symbol | import('@hapi/hapi').ResponseObject} continue, or a redirect to enter address that takes over the request
 */
export function redirectWhenSignedIn(request, h) {
  if (!request.auth.credentials) {
    return h.continue
  }

  const code =
    request.method === 'post'
      ? statusCodes.redirectAfterPost
      : statusCodes.found
  return h.redirect(enterAddressPath).code(code).takeover()
}
