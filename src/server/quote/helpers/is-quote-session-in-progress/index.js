import { routePath as applicationTypeNotAvailablePath } from '../../application-type-not-available/route-path.js'
import { routePath as planningTypePath } from '../../planning-type/route-path.js'
import { routePath as confirmationPath } from '../../confirmation/routes.js'
import { routePath as startPath } from '../../../manage/start-page/routes.js'
import { routePath as deleteConfirmationPath } from '../../delete-quote-confirmation/routes.js'
import { routePath as confirmHousingPath } from '../../confirm-housing/route-path.js'
import { routePath as notHousingPath } from '../../not-housing/route-path.js'
import { referencePattern, tokenPattern } from '../../quote-details/routes.js'
import { getQuoteDataFromCache } from '../quote-session-cache/index.js'
import { appendChangeParam } from '../change-mode/index.js'

const exemptPaths = new Set([confirmationPath, deleteConfirmationPath])

const quoteDetailsPattern = new RegExp(
  `^\\/quote\\/${referencePattern.source}\\/` + `${tokenPattern.source}$`
)

// The quote-details GET link and the two resend POSTs are token/email-gated,
// not session-gated, so they bypass the in-progress-session check.
const resendPattern = new RegExp(
  `^\\/quote\\/${referencePattern.source}\\/resend-(known|unknown)$`
)

const isExempt = (path) =>
  exemptPaths.has(path) ||
  quoteDetailsPattern.test(path) ||
  resendPattern.test(path)

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
  if (quoteData === null) {
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
