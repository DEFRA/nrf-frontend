import { routePath as startPath } from '../../../manage/start-page/route-path.js'
import { routePath as haveNrlReferencePath } from '../../have-nrl-reference/route-path.js'
import { routePath as enterNrlReferencePath } from '../../enter-nrl-reference/route-path.js'
import { routePath as enterEmailPath } from '../../enter-email/route-path.js'
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
  enterEmailPath
])

/**
 * @param {import('@hapi/hapi').Request} request
 * @returns {boolean} whether this is the enter your NRL reference page with a valid reference to pre-fill
 */
const hasValidPrefillReference = ({ path, query }) =>
  path === enterNrlReferencePath &&
  nrlReferenceField.validate(query.nrlReference).error === undefined

/**
 * The enter your email address page is only reachable with a saved NRL
 * reference, which a submitted email alone does not provide.
 * @param {import('@hapi/hapi').Request} request
 * @returns {boolean} whether the retrieve quote answers hold what this page needs
 */
const hasRequiredAnswers = (request) => {
  const answers = retrieveQuoteSession.get(request)
  if (answers === null) return false
  return request.path !== enterEmailPath || Boolean(answers.nrlReference)
}

/**
 * @param {import('@hapi/hapi').Request} request
 * @returns {boolean} whether request to use was chosen and the retrieve quote answers exist
 */
const isRetrieveQuoteSessionValid = (request) =>
  isJourneySelected({ request, journey: journeys.requestToUse }) &&
  hasRequiredAnswers(request)

/**
 * Redirects to the start page when a retrieve quote page is requested without
 * a retrieve quote session. A link from the quote email to the enter your NRL
 * reference page with a valid reference starts the session itself.
 * @type {import('@hapi/hapi').Lifecycle.Method}
 */
export const checkForValidRetrieveQuoteSession = (request, h) => {
  if (request.method !== 'get' || !guardedPaths.has(request.path)) {
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
