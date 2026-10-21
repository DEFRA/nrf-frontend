import { routePath as startPath } from '../../../manage/start-page/route-path.js'
import { routePath as haveNrlReferencePath } from '../../have-nrl-reference/route-path.js'
import { routePath as enterNrlReferencePath } from '../../enter-nrl-reference/route-path.js'
import { routePath as enterEmailPath } from '../../enter-email/route-path.js'
import { routePath as emailConfirmationPath } from '../../email-confirmation/route-path.js'
import { routePath as noNrlReferencePath } from '../../no-nrl-reference/route-path.js'
import { routePath as quoteNotMatchedPath } from '../../quote-not-matched/route-path.js'
import { nrlReferenceField } from '../../enter-nrl-reference/form-validation.js'
import { retrieveQuoteSession } from '../retrieve-quote-session/index.js'
import {
  isRetrieveQuoteEmailSent,
  isRetrieveQuoteEmailSentSession
} from '../retrieve-quote-email-sent/index.js'
import {
  isJourneySelected,
  journeys,
  selectJourney
} from '../../../common/helpers/journey-session/index.js'

// Exact paths, not a prefix, so the confirmation page stays reachable.
const guardedPaths = new Set([
  haveNrlReferencePath,
  enterNrlReferencePath,
  enterEmailPath,
  noNrlReferencePath,
  quoteNotMatchedPath
])

/**
 * @param {import('@hapi/hapi').Request} request
 * @returns {boolean} whether this is the enter your NRL reference page with a valid reference to pre-fill
 */
const hasValidPrefillReference = ({ path, query }) =>
  path === enterNrlReferencePath &&
  nrlReferenceField.validate(query.nrlReference).error === undefined

/**
 * A saved email with no other answer is what remains after the email was
 * accepted (the confirmation page keeps it to display), so it does not make
 * the retrieve quote pages reachable again. The enter your email address page
 * also needs a saved NRL reference, and the details do not match dropout needs
 * both an NRL reference and an email, which is what a failed match leaves.
 * @param {import('@hapi/hapi').Request} request
 * @returns {boolean} whether the retrieve quote answers hold what this page needs
 */
const hasRequiredAnswers = (request) => {
  const answers = retrieveQuoteSession.get(request)
  if (answers === null) return false
  if (request.path === enterEmailPath) return Boolean(answers.nrlReference)
  if (request.path === quoteNotMatchedPath) {
    return Boolean(answers.nrlReference && answers.email)
  }
  return !isRetrieveQuoteEmailSent(answers)
}

/**
 * @param {import('@hapi/hapi').Request} request
 * @returns {boolean} whether request to use was chosen and the retrieve quote answers exist
 */
const isRetrieveQuoteSessionValid = (request) =>
  isJourneySelected({ request, journey: journeys.requestToUse }) &&
  hasRequiredAnswers(request)

/**
 * Redirects to the start page when a guarded retrieve quote page is requested
 * without the answers it needs, and when the confirmation page is requested
 * before the email was accepted. A link from the quote email to the enter your
 * NRL reference page with a valid reference starts the session itself.
 * @type {import('@hapi/hapi').Lifecycle.Method}
 */
export const checkForValidRetrieveQuoteSession = (request, h) => {
  if (request.method !== 'get') {
    return h.continue
  }

  if (request.path === emailConfirmationPath) {
    return isRetrieveQuoteEmailSentSession(request)
      ? h.continue
      : h.redirect(startPath).takeover()
  }

  if (!guardedPaths.has(request.path)) {
    return h.continue
  }

  if (hasValidPrefillReference(request)) {
    selectJourney({ request, journey: journeys.requestToUse })
    return h.continue
  }

  if (!isRetrieveQuoteSessionValid(request)) {
    return h.redirect(startPath).takeover()
  }

  return h.continue
}
