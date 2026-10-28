import { quoteController } from '../controller-get.js'
import getViewModel from './get-view-model.js'
import { routePath } from './route-path.js'
import { getQuoteDataFromCache } from '../helpers/quote-session-cache/index.js'
import { hasRequestToUseSession } from '../helpers/is-quote-session-in-progress/index.js'

const routeId = 'not-in-edp'

export { routePath }

// The dropout page is shared by both journeys, so the session data says which
// journey the boundary came from: a user editing their saved quote from the
// review page must go back to the change alias's boundary steps — the quote
// journey's own pages would bounce them to the start page.
const getSessionData = (request) => ({
  ...getQuoteDataFromCache(request),
  isEditingSavedQuote: hasRequestToUseSession(request)
})

/**
 * @openapi
 * /quote/not-in-edp:
 *   get:
 *     tags:
 *       - Quote
 *     summary: No EDP information page
 *     description: Renders an informational page when no EDP applies
 *     responses:
 *       200:
 *         description: HTML information page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
export default [
  {
    method: 'GET',
    path: routePath,
    ...quoteController({ routeId, getViewModel, getSessionData })
  }
]
