import { compareQuoteBoundariesInBackend } from '../../common/services/nrf-backend.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { saveOriginalReference } from '../helpers/request-to-use-session/index.js'
import { getQuoteDataFromCache } from '../../quote/helpers/quote-session-cache/index.js'
import { routePath as startPath } from '../../manage/start-page/route-path.js'
import { routePath as originalReferenceNotMatchedPath } from '../original-reference-not-matched/route-path.js'
import { routePath as originalBoundaryNotMatchedPath } from '../original-boundary-not-matched/route-path.js'
import getNextPage from './get-next-page.js'

/**
 * @typedef {object} OriginalReferenceRedirects
 * @property {(sessionData: object) => string} nextPageAfterMatch - where a matching reference continues to
 * @property {string} referenceNotMatchedPath - where an unknown reference goes
 * @property {string} boundaryNotMatchedPath - where a reference with a different boundary goes
 */

/**
 * @param {object} params
 * @param {{ originalFound: boolean, boundariesMatch?: boolean }} params.comparison
 * @param {object} params.sessionData - the saved request to use session data
 * @param {OriginalReferenceRedirects} params.redirects
 * @returns {string} path of the page to redirect to
 */
const getRedirectPath = ({
  comparison,
  sessionData,
  redirects: {
    nextPageAfterMatch,
    referenceNotMatchedPath,
    boundaryNotMatchedPath
  }
}) => {
  const { originalFound, boundariesMatch } = comparison

  if (!originalFound) {
    return referenceNotMatchedPath
  }
  return boundariesMatch
    ? nextPageAfterMatch(sessionData)
    : boundaryNotMatchedPath
}

/**
 * @param {Partial<OriginalReferenceRedirects>} [redirects] - overrides for the journey's own pages
 * @returns {{ handler: import('@hapi/hapi').Lifecycle.Method }} the POST controller
 */
export const createOriginalReferencePostController = ({
  nextPageAfterMatch = getNextPage,
  referenceNotMatchedPath = originalReferenceNotMatchedPath,
  boundaryNotMatchedPath = originalBoundaryNotMatchedPath
} = {}) => ({
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
      .redirect(
        getRedirectPath({
          comparison,
          sessionData,
          redirects: {
            nextPageAfterMatch,
            referenceNotMatchedPath,
            boundaryNotMatchedPath
          }
        })
      )
      .code(statusCodes.redirectAfterPost)
  }
})

export const originalReferencePostController =
  createOriginalReferencePostController()
