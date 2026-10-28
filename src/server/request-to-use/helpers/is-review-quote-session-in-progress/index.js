import { routePath as startPath } from '../../../manage/start-page/route-path.js'
import { routePath as reviewQuoteDetailsPath } from '../../review-quote-details/route-path.js'
import { routePath as acceptLevyPath } from '../../accept-levy/route-path.js'
import { routePath as defraAccountUserTypePath } from '../../defra-account-user-type/route-path.js'
import { routePath as defraAccountIndividualPath } from '../../defra-account-individual/route-path.js'
import { routePath as defraAccountOrganisationPath } from '../../defra-account-organisation/route-path.js'
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

const guardedPaths = new Set([
  reviewQuoteDetailsPath,
  acceptLevyPath,
  defraAccountUserTypePath,
  defraAccountIndividualPath,
  defraAccountOrganisationPath,
  changePlanningTypePath,
  changeConfirmHousingPath,
  changeUnitNumberPath,
  changeApplicationTypeNotAvailablePath,
  changeNotHousingPath
])

/**
 * Redirects to the start page when the review quote details page, the accept
 * levy page, the who are you requesting to use the levy for page, the Defra
 * account pages or one of the change pages is requested without both a
 * complete saved quote and a request to use session, which magic link
 * redemption sets.
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
