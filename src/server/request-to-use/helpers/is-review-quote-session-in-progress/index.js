import { routePath as startPath } from '../../../manage/start-page/route-path.js'
import { routePath as reviewQuoteDetailsPath } from '../../review-quote-details/route-path.js'
import { routePath as acceptLevyPath } from '../../accept-levy/route-path.js'
import { routePath as deleteQuotePath } from '../../delete-quote/route-path.js'
import { routePath as defraAccountUserTypePath } from '../../defra-account-user-type/route-path.js'
import { routePath as defraAccountIndividualPath } from '../../defra-account-individual/route-path.js'
import { routePath as defraAccountOrganisationPath } from '../../defra-account-organisation/route-path.js'
import { routePath as defraAccountAgentPath } from '../../defra-account-agent/route-path.js'
import { routePath as changePlanningTypePath } from '../../change/planning-type/route-path.js'
import { routePath as changeConfirmHousingPath } from '../../change/confirm-housing/route-path.js'
import { routePath as changeUnitNumberPath } from '../../change/unit-number/route-path.js'
import { routePath as changeApplicationTypeNotAvailablePath } from '../../change/application-type-not-available/route-path.js'
import { routePath as changeNotHousingPath } from '../../change/not-housing/route-path.js'
import { routePath as changeBoundaryTypePath } from '../../change/boundary-type/route-path.js'
import { routePath as changeDrawBoundaryPath } from '../../change/draw-boundary/route-path.js'
import { routePath as changeUploadBoundaryPath } from '../../change/upload-boundary/route-path.js'
import { routePath as changeCheckingFilePath } from '../../change/checking-file/route-path.js'
import { routePath as changeFilePreviewPath } from '../../change/file-preview/route-path.js'
import { routePath as changeNotInEdpPath } from '../../change/not-in-edp/route-path.js'
import { routePath as changeExcludedAreaPath } from '../../change/excluded-area/route-path.js'
import { isQuoteDataComplete } from '../../../quote/helpers/quote-session-cache/index.js'
import { requestToUseSession } from '../request-to-use-session/index.js'

/**
 * @param {import('@hapi/hapi').Request} request
 * @returns {boolean} whether a request to use session exists
 */
const hasRequestToUseSession = (request) =>
  requestToUseSession.get(request) !== null

// The change pages reached from the review page's change links — and the
// dropout pages an ineligible change redirects to — need only the request to
// use session a magic link redemption sets: mid-edit the quote cache is
// legitimately incomplete, because choosing a different boundary entry type
// clears the saved boundary until a new one is drawn or uploaded. The pages
// that render the saved quote itself — the review page, the accept levy page
// continuing from it and the Defra account pages following it — still need
// the complete quote.
const changePaths = new Set([
  changePlanningTypePath,
  changeConfirmHousingPath,
  changeUnitNumberPath,
  changeApplicationTypeNotAvailablePath,
  changeNotHousingPath,
  changeBoundaryTypePath,
  changeDrawBoundaryPath,
  changeUploadBoundaryPath,
  changeCheckingFilePath,
  changeFilePreviewPath,
  changeNotInEdpPath,
  changeExcludedAreaPath
])

const completeQuotePaths = new Set([
  reviewQuoteDetailsPath,
  acceptLevyPath,
  deleteQuotePath,
  defraAccountUserTypePath,
  defraAccountIndividualPath,
  defraAccountOrganisationPath,
  defraAccountAgentPath
])

/**
 * Redirects to the start page when the review quote details page, the accept
 * levy page, the delete quote page, the Defra account pages or a change page
 * reached from the review page's change links is requested without the
 * session state magic link redemption sets. The review, accept levy, delete
 * quote and Defra account pages need the complete saved quote they render or
 * act on; the change pages only the request to use session.
 * @type {import('@hapi/hapi').Lifecycle.Method}
 */
export const checkForValidReviewQuoteSession = (request, h) => {
  // HEAD requests are routed to GET routes but keep their own method, so they
  // must be guarded too or the page handler runs unguarded.
  if (request.method !== 'get' && request.method !== 'head') {
    return h.continue
  }

  const isChangePage = changePaths.has(request.path)

  if (!isChangePage && !completeQuotePaths.has(request.path)) {
    return h.continue
  }

  if (!hasRequestToUseSession(request)) {
    return h.redirect(startPath).takeover()
  }

  if (!isChangePage && !isQuoteDataComplete(request)) {
    return h.redirect(startPath).takeover()
  }

  return h.continue
}
