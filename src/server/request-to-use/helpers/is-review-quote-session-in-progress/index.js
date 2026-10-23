import { routePath as startPath } from '../../../manage/start-page/route-path.js'
import { routePath as reviewQuoteDetailsPath } from '../../review-quote-details/route-path.js'
import { routePath as changePlanningTypePath } from '../../change/planning-type/route-path.js'
import { routePath as changeConfirmHousingPath } from '../../change/confirm-housing/route-path.js'
import { routePath as changeUnitNumberPath } from '../../change/unit-number/route-path.js'
import { routePath as changeApplicationTypeNotAvailablePath } from '../../change/application-type-not-available/route-path.js'
import { routePath as changeNotHousingPath } from '../../change/not-housing/route-path.js'
import { isQuoteDataComplete } from '../../../quote/helpers/quote-session-cache/index.js'
import { requestToUseSession } from '../request-to-use-session/index.js'

/**
 * @param {import('@hapi/hapi').Request} request
 * @returns {boolean} whether a complete set of saved quote answers and a request to use session both exist
 */
const isReviewQuoteSessionValid = (request) =>
  isQuoteDataComplete(request) && requestToUseSession.get(request) !== null

// The review page, the change pages its change links open, and the dropout
// pages an ineligible change leads to all need the complete saved quote and
// the request to use session magic link redemption (NRF2-1256) sets: editing
// one of these answers cannot break the quote's completeness.
const guardedPaths = new Set([
  reviewQuoteDetailsPath,
  changePlanningTypePath,
  changeConfirmHousingPath,
  changeUnitNumberPath,
  changeApplicationTypeNotAvailablePath,
  changeNotHousingPath
])

/**
 * Redirects to the start page when the review quote details page or one of its
 * change pages is requested without both a complete saved quote and a request
 * to use session, which magic link redemption (NRF2-1256) sets.
 * @type {import('@hapi/hapi').Lifecycle.Method}
 */
export const checkForValidReviewQuoteSession = (request, h) => {
  // HEAD requests are routed to GET routes but keep their own method, so they
  // must be guarded too or the page handler runs unguarded.
  if (
    (request.method !== 'get' && request.method !== 'head') ||
    !guardedPaths.has(request.path)
  ) {
    return h.continue
  }

  if (!isReviewQuoteSessionValid(request)) {
    return h.redirect(startPath).takeover()
  }

  return h.continue
}
