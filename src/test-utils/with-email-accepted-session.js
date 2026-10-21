import { submitRetrieveQuoteAnswers } from './submit-retrieve-quote-answers.js'
import { mockEmailQuoteLink } from './mock-get-quote.js'

/**
 * Prime the session left after the email was accepted, by driving the real
 * routes. Returns the session cookie.
 * @param {object} server
 * @param {object} mswServer - the MSW server used to mock the backend
 * @returns {Promise<string>}
 */
export async function withEmailAcceptedSession(server, mswServer) {
  mockEmailQuoteLink(mswServer)
  return submitRetrieveQuoteAnswers(server)
}
