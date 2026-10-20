import { submitForm } from './submit-form.js'
import { withValidRetrieveQuoteSession } from './with-valid-retrieve-quote-session.js'
import { mockEmailQuoteLink } from './mock-get-quote.js'
import { fullQuote } from './fixtures/quote.js'
import { routePath as haveNrlReferencePath } from '../server/request-to-use/have-nrl-reference/route-path.js'
import { routePath as enterNrlReferencePath } from '../server/request-to-use/enter-nrl-reference/route-path.js'
import { routePath as enterEmailPath } from '../server/request-to-use/enter-email/route-path.js'

/**
 * Prime the session left after the email was accepted, by driving the real
 * routes. Returns the session cookie.
 * @param {object} server
 * @param {object} mswServer - the MSW server used to mock the backend
 * @returns {Promise<string>}
 */
export async function withEmailAcceptedSession(server, mswServer) {
  mockEmailQuoteLink(mswServer)
  let cookie = await withValidRetrieveQuoteSession(server)
  const steps = [
    [haveNrlReferencePath, { hasNrlReference: 'yes' }],
    [enterNrlReferencePath, { nrlReference: fullQuote.reference }],
    [enterEmailPath, { email: fullQuote.email.address }]
  ]
  for (const [requestUrl, formData] of steps) {
    ;({ cookie } = await submitForm({ requestUrl, server, formData, cookie }))
  }
  return cookie
}
