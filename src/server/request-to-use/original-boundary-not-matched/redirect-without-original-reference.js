import { statusCodes } from '../../common/constants/status-codes.js'
import { requestToUseSession } from '../helpers/request-to-use-session/index.js'
import { routePath as originalReferenceNotMatchedPath } from '../original-reference-not-matched/route-path.js'

/**
 * Builds a route pre-handler: the boundary not matched page names the
 * original NRL reference, so without one in the session it sends the user to
 * the reference not found dropout.
 * @param {string} notFoundPath - the reference not found dropout to redirect to
 * @returns {import('@hapi/hapi').Lifecycle.Method} the pre-handler
 */
export const createRedirectWithoutOriginalReference = (notFoundPath) =>
  function redirectToNotFoundWithoutOriginalReference(request, h) {
    if (requestToUseSession.get(request)?.originalNrlReference) {
      return h.continue
    }

    return h.redirect(notFoundPath).code(statusCodes.found).takeover()
  }

export const redirectWithoutOriginalReference =
  createRedirectWithoutOriginalReference(originalReferenceNotMatchedPath)
