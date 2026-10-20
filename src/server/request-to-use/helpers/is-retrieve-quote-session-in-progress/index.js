import { routePath as startPath } from '../../../manage/start-page/route-path.js'
import { routePath as haveNrlReferencePath } from '../../have-nrl-reference/route-path.js'
import { routePath as enterNrlReferencePath } from '../../enter-nrl-reference/route-path.js'
import { routePath as enterEmailPath } from '../../enter-email/route-path.js'
import { routePath as emailConfirmationPath } from '../../email-confirmation/route-path.js'
import { routePath as noNrlReferencePath } from '../../no-nrl-reference/route-path.js'
import { routePath as whatWouldYouLikeToDoPath } from '../../../manage/what-would-you-like-to-do/route-path.js'
import { nrlReferenceField } from '../../enter-nrl-reference/form-validation.js'
import { retrieveQuoteSession } from '../retrieve-quote-session/index.js'
import {
  isJourneySelected,
  journeys,
  selectJourney
} from '../../../common/helpers/journey-session/index.js'

// Exact paths, not a prefix, so the dropout and confirmation pages stay reachable.
const guardedPaths = new Set([
  haveNrlReferencePath,
  enterNrlReferencePath,
  enterEmailPath,
  noNrlReferencePath
])

/**
 * @param {import('@hapi/hapi').Request} request
 * @returns {boolean} whether this is the enter your NRL reference page with a valid reference to pre-fill
 */
const hasValidPrefillReference = ({ path, query }) =>
  path === enterNrlReferencePath &&
  nrlReferenceField.validate(query.nrlReference).error === undefined

/**
 * @param {object} answers - the saved retrieve quote answers
 * @returns {boolean} whether only an email remains, which is the state after the email was accepted
 */
const isRetrieveQuoteEmailSent = (answers) =>
  !answers.hasNrlReference && !answers.nrlReference && Boolean(answers.email)

/**
 * A saved email with no other answer is what remains after the email was
 * accepted (the confirmation page keeps it to display), so it does not make
 * the retrieve quote pages reachable again. The enter your email address page
 * also needs a saved NRL reference.
 * @param {import('@hapi/hapi').Request} request
 * @returns {boolean} whether the retrieve quote answers hold what this page needs
 */
const hasRequiredAnswers = (request) => {
  const answers = retrieveQuoteSession.get(request)
  if (answers === null) return false
  if (request.path === enterEmailPath) return Boolean(answers.nrlReference)
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
 * @param {import('@hapi/hapi').Request} request
 * @returns {boolean} whether the email was accepted, the only state in which the confirmation page is reachable
 */
const isRetrieveQuoteEmailSentSession = (request) => {
  const answers = retrieveQuoteSession.get(request)
  return (
    isJourneySelected({ request, journey: journeys.requestToUse }) &&
    answers !== null &&
    isRetrieveQuoteEmailSent(answers)
  )
}

/**
 * Redirects to the start page when a retrieve quote page is requested without
 * a retrieve quote session. A link from the quote email to the enter your NRL
 * reference page with a valid reference starts the session itself.
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

/**
 * The what would you like to do page is the entry point after the start page,
 * so it is only closed once the email has been accepted. Registered by the
 * manage plugin, because the guard above only covers request to use routes.
 * @type {import('@hapi/hapi').Lifecycle.Method}
 */
export const checkForAcceptedEmail = (request, h) => {
  if (request.method !== 'get' || request.path !== whatWouldYouLikeToDoPath) {
    return h.continue
  }

  return isRetrieveQuoteEmailSentSession(request)
    ? h.redirect(startPath).takeover()
    : h.continue
}
