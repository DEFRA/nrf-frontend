import { retrieveQuoteSession } from '../retrieve-quote-session/index.js'
import {
  isJourneySelected,
  journeys
} from '../../../common/helpers/journey-session/index.js'

/**
 * The email was accepted when it is the only retrieve quote answer left: the
 * email POST clears the rest and saves the email for the confirmation page.
 * Saving any other answer on this journey changes what this returns.
 * @param {object} answers - the saved retrieve quote answers
 * @returns {boolean} whether only an email remains
 */
export const isRetrieveQuoteEmailSent = (answers) =>
  !answers.hasNrlReference && !answers.nrlReference && Boolean(answers.email)

/**
 * @param {import('@hapi/hapi').Request} request
 * @returns {boolean} whether request to use was chosen and the email was accepted
 */
export const isRetrieveQuoteEmailSentSession = (request) => {
  const answers = retrieveQuoteSession.get(request)
  return (
    isJourneySelected({ request, journey: journeys.requestToUse }) &&
    answers !== null &&
    isRetrieveQuoteEmailSent(answers)
  )
}
