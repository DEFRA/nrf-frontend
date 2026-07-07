import { routePath as planningTypePath } from '../../planning-type/routes.js'
import { routePath as confirmationPath } from '../../confirmation/routes.js'
import { routePath as startPath } from '../../start/routes.js'
import { getQuoteDataFromCache } from '../quote-session-cache/index.js'
import { routePath as deleteConfirmationPath } from '../../delete-quote-confirmation/routes.js'
import { referencePattern, tokenPattern } from '../../quote-details/routes.js'

const exemptPaths = new Set([
  planningTypePath,
  confirmationPath,
  deleteConfirmationPath
])

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

export const checkForValidQuoteSession = (request, h) => {
  if (
    request.method !== 'get' ||
    !request.path.startsWith('/quote/') ||
    isExempt(request.path)
  ) {
    return h.continue
  }

  const { planningType } = getQuoteDataFromCache(request)
  if (!planningType) {
    return h.redirect(startPath).takeover()
  }

  return h.continue
}
