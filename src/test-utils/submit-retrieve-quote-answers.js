import { submitForm } from './submit-form.js'
import { withValidRetrieveQuoteSession } from './with-valid-retrieve-quote-session.js'
import { fullQuote } from './fixtures/quote.js'
import { routePath as haveNrlReferencePath } from '../server/request-to-use/have-nrl-reference/route-path.js'
import { routePath as enterNrlReferencePath } from '../server/request-to-use/enter-nrl-reference/route-path.js'
import { routePath as enterEmailPath } from '../server/request-to-use/enter-email/route-path.js'

const steps = [
  { requestUrl: haveNrlReferencePath, formData: { hasNrlReference: 'yes' } },
  {
    requestUrl: enterNrlReferencePath,
    formData: { nrlReference: fullQuote.reference }
  },
  { requestUrl: enterEmailPath, formData: { email: fullQuote.email.address } }
]

/**
 * Drive the real retrieve quote routes from the start, answering each page.
 * The backend response to the final email POST decides the outcome, so mock it
 * first. Returns the session cookie.
 * @param {object} server
 * @returns {Promise<string>}
 */
export async function submitRetrieveQuoteAnswers(server) {
  let cookie = await withValidRetrieveQuoteSession(server)
  for (const { requestUrl, formData } of steps) {
    const result = await submitForm({ requestUrl, server, formData, cookie })
    cookie = result.cookie
  }
  return cookie
}
