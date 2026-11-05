import { statusCodes } from '../../common/constants/status-codes.js'
import { requestToUseSession } from '../helpers/request-to-use-session/index.js'
import { routePath as originalReferenceNotMatchedPath } from '../original-reference-not-matched/route-path.js'

/**
 * Route pre-handler: this page names the original NRL reference, so without
 * one in the session it sends the user to the reference not found dropout.
 * @param {import('@hapi/hapi').Request} request
 * @param {import('@hapi/hapi').ResponseToolkit} h
 * @returns {symbol | import('@hapi/hapi').ResponseObject} continue, or a redirect that takes over the request
 */
export function redirectWithoutOriginalReference(request, h) {
  if (requestToUseSession.get(request)?.originalNrlReference) {
    return h.continue
  }

  return h
    .redirect(originalReferenceNotMatchedPath)
    .code(statusCodes.found)
    .takeover()
}
