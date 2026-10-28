import { routePath as applicationTypeNotAvailablePath } from '../../application-type-not-available/route-path.js'
import { routePath as planningTypePath } from '../../planning-type/route-path.js'
import { routePath as confirmationPath } from '../../confirmation/routes.js'
import { routePath as startPath } from '../../../manage/start-page/routes.js'
import { routePath as deleteConfirmationPath } from '../../delete-quote-confirmation/routes.js'
import { routePath as confirmHousingPath } from '../../confirm-housing/route-path.js'
import { routePath as notHousingPath } from '../../not-housing/route-path.js'
import { getQuoteDataFromCache } from '../quote-session-cache/index.js'
import { appendChangeParam, isDropoutPage } from '../change-mode/index.js'
import {
  isJourneySelected,
  journeys
} from '../../../common/helpers/journey-session/index.js'
import { requestToUseSession } from '../../../request-to-use/helpers/request-to-use-session/index.js'

const exemptPaths = new Set([confirmationPath, deleteConfirmationPath])

const isExempt = (path) => exemptPaths.has(path)

// A user editing their saved quote from the review and amend page chose the
// request to use journey, so the quote journey check below would bounce them
// off the dropout pages their change redirects to: an ineligible answer or a
// boundary outside an EDP lands on the quote journey's dropout pages. Their
// live request to use session is the evidence of the edit, and it opens the
// dropout pages only — the pages that continue the quote journey stay closed,
// so an edit cannot wander into it.
const isEditingSavedQuote = (request) =>
  isDropoutPage(request.path) && requestToUseSession.get(request) !== null

// The dropout redirects carry change=true when the intercepted request had
// it, so a user editing from check-your-answers keeps change mode after being
// bounced to the dropout page.
/**
 * @param {object} params
 * @param {string} params.planningType
 * @param {string} params.path - the intercepted request path
 * @param {import('@hapi/hapi').ResponseToolkit} params.h
 * @param {object} params.query - the parsed request query
 * @returns {import('@hapi/hapi').Lifecycle.ReturnValue | undefined} takeover
 * redirect, or undefined to fall through to the next check
 */
const redirectIfPlanningTypeOther = ({ planningType, path, h, query }) => {
  if (
    planningType === 'other' &&
    path !== applicationTypeNotAvailablePath &&
    path !== planningTypePath
  ) {
    return h
      .redirect(appendChangeParam(applicationTypeNotAvailablePath, query))
      .takeover()
  }
  return undefined
}

/**
 * @param {object} params
 * @param {string} params.isHousing
 * @param {string} params.path - the intercepted request path
 * @param {import('@hapi/hapi').ResponseToolkit} params.h
 * @param {object} params.query - the parsed request query
 * @returns {import('@hapi/hapi').Lifecycle.ReturnValue | undefined} takeover
 * redirect, or undefined to fall through to the next check
 */
const redirectIfNotHousing = ({ isHousing, path, h, query }) => {
  if (
    isHousing === 'no' &&
    path !== notHousingPath &&
    path !== confirmHousingPath &&
    path !== planningTypePath
  ) {
    return h.redirect(appendChangeParam(notHousingPath, query)).takeover()
  }
  return undefined
}

export const checkForValidQuoteSession = (request, h) => {
  if (
    request.method !== 'get' ||
    !request.path.startsWith('/quote/') ||
    isExempt(request.path)
  ) {
    return h.continue
  }

  const quoteData = getQuoteDataFromCache(request)
  if (
    quoteData === null ||
    (!isJourneySelected({ request, journey: journeys.quote }) &&
      !isEditingSavedQuote(request))
  ) {
    return h.redirect(startPath).takeover()
  }

  const { planningType, isHousing } = quoteData
  return (
    redirectIfPlanningTypeOther({
      planningType,
      path: request.path,
      h,
      query: request.query
    }) ??
    redirectIfNotHousing({
      isHousing,
      path: request.path,
      h,
      query: request.query
    }) ??
    h.continue
  )
}
