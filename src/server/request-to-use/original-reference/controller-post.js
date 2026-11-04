import { compareQuoteBoundariesInBackend } from '../../common/services/nrf-backend.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import {
  requestToUseSession,
  saveOriginalReference
} from '../helpers/request-to-use-session/index.js'
import { routePath as originalReferenceNotMatchedPath } from '../original-reference-not-matched/route-path.js'
import { routePath as variationBoundariesNotMatchedPath } from '../variation-boundaries-not-matched/route-path.js'
import getNextPage from './get-next-page.js'

/**
 * @param {{ originalFound: boolean, boundariesMatch?: boolean }} comparison
 * @param {object} sessionData - the saved request to use session data
 * @returns {string} path of the page to redirect to
 */
const getRedirectPath = ({ originalFound, boundariesMatch }, sessionData) => {
  if (!originalFound) {
    return originalReferenceNotMatchedPath
  }
  return boundariesMatch
    ? getNextPage(sessionData)
    : variationBoundariesNotMatchedPath
}

export const originalReferencePostController = {
  async handler(request, h) {
    const sessionData = saveOriginalReference(request, request.payload)

    const comparison = await compareQuoteBoundariesInBackend({
      originalReference: sessionData.originalNrlReference,
      currentReference: requestToUseSession.get(request)?.nrlReference
    })

    return h
      .redirect(getRedirectPath(comparison, sessionData))
      .code(statusCodes.redirectAfterPost)
  }
}
