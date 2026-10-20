import { submitRetrieveQuoteAnswers } from './submit-retrieve-quote-answers.js'
import { mockEmailQuoteLink } from './mock-get-quote.js'
import { fullQuote } from './fixtures/quote.js'

/**
 * Prime the session left after an email that matches no quote, by driving the
 * real routes. Returns the session cookie.
 * @param {object} server
 * @param {object} mswServer - the MSW server used to mock the backend
 * @returns {Promise<string>}
 */
export async function withQuoteNotMatchedSession(server, mswServer) {
  mockEmailQuoteLink(mswServer, { ...fullQuote, reference: 'NRL-999999' })
  return submitRetrieveQuoteAnswers(server)
}
