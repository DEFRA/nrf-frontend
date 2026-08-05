import { routePath as applicationTypeNotAvailablePath } from '../../application-type-not-available/routes.js'
import { routePath as planningTypePath } from '../../planning-type/routes.js'
import { routePath as confirmationPath } from '../../confirmation/routes.js'
import { routePath as startPath } from '../../start/routes.js'
import { routePath as deleteConfirmationPath } from '../../delete-quote-confirmation/routes.js'
import { routePath as confirmHousingPath } from '../../confirm-housing/routes.js'
import { routePath as notHousingPath } from '../../not-housing/routes.js'
import { routePath as excludedAreaPath } from '../../excluded-area/routes.js'
import { routePath as emailPath } from '../../email/routes.js'
import { routePath as checkyouranswersPath } from '../../check-your-answers/routes.js'
import { referencePattern, tokenPattern } from '../../quote-details/routes.js'
import { getQuoteDataFromCache } from '../quote-session-cache/index.js'

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

const redirectIfExcludedArea = (intersectingExcludedAreas, path, h) => {
  const intersectsExcludedArea = intersectingExcludedAreas.length > 0
  if (
    intersectsExcludedArea &&
    (path === emailPath || path === checkyouranswersPath)
  ) {
    return h.redirect(excludedAreaPath).takeover()
  }
  return undefined
}

const redirectIfPlanningTypeOther = (planningType, path, h) => {
  if (
    planningType === 'other' &&
    path !== applicationTypeNotAvailablePath &&
    path !== planningTypePath
  ) {
    return h.redirect(applicationTypeNotAvailablePath).takeover()
  }
  return undefined
}

const redirectIfNotHousing = (isHousing, path, h) => {
  if (
    isHousing === 'no' &&
    path !== notHousingPath &&
    path !== confirmHousingPath &&
    path !== planningTypePath
  ) {
    return h.redirect(notHousingPath).takeover()
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

  const { planningType, isHousing, boundaryGeojson } = quoteData
  return (
    redirectIfExcludedArea(
      boundaryGeojson?.intersectingExcludedAreas || [],
      request.path,
      h
    ) ??
    redirectIfPlanningTypeOther(planningType, request.path, h) ??
    redirectIfNotHousing(isHousing, request.path, h) ??
    h.continue
  )
}
