import { compareQuoteBoundariesInBackend } from '../../common/services/nrf-backend.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { saveOriginalReference } from '../helpers/request-to-use-session/index.js'
import { getQuoteDataFromCache } from '../../quote/helpers/quote-session-cache/index.js'
import { routePath as startPath } from '../../manage/start-page/route-path.js'
import { routePath as originalReferenceNotMatchedPath } from '../original-reference-not-matched/route-path.js'
import { routePath as originalBoundaryNotMatchedPath } from '../original-boundary-not-matched/route-path.js'
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
    : originalBoundaryNotMatchedPath
}

export const originalReferencePostController = {
  async handler(request, h) {
    const currentBoundaryGeoJson =
      getQuoteDataFromCache(request)?.boundaryGeojson?.boundaryGeometryWgs84

    if (!currentBoundaryGeoJson) {
      return h.redirect(startPath).code(statusCodes.redirectAfterPost)
    }

    const sessionData = saveOriginalReference(request, request.payload)

    const comparison = await compareQuoteBoundariesInBackend({
      originalReference: sessionData.originalNrlReference,
      currentBoundaryGeoJson
    })

    return h
      .redirect(getRedirectPath(comparison, sessionData))
      .code(statusCodes.redirectAfterPost)
  }
}
