import { routePath as startPath } from '../../../manage/start-page/route-path.js'
import { routePath as reviewQuoteDetailsPath } from '../../review-quote-details/route-path.js'
import { getQuoteDataFromCache } from '../../../quote/helpers/quote-session-cache/index.js'
import { requestToUseKey } from '../../../common/helpers/journey-session/index.js'

/**
 * @param {import('@hapi/hapi').Request} request
 * @returns {boolean} whether saved quote answers and a request to use session both exist
 */
const isReviewQuoteSessionValid = (request) =>
  getQuoteDataFromCache(request) !== null &&
  request.yar.get(requestToUseKey) !== null

/**
 * Redirects to the start page when the review quote details page is requested
 * without both a saved quote and a request to use session. The requestToUse
 * key is what magic link redemption (NRF2-1256) will set; until that is
 * built, no real user journey can reach the page.
 * @type {import('@hapi/hapi').Lifecycle.Method}
 */
export const checkForValidReviewQuoteSession = (request, h) => {
  // HEAD requests are routed to GET routes but keep their own method, so they
  // must be guarded too or the page handler runs unguarded.
  if (
    (request.method !== 'get' && request.method !== 'head') ||
    request.path !== reviewQuoteDetailsPath
  ) {
    return h.continue
  }

  if (!isReviewQuoteSessionValid(request)) {
    return h.redirect(startPath).takeover()
  }

  return h.continue
}
