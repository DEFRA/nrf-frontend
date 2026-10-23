import joi from 'joi'
import { requestToUseController } from '../controller-get.js'
import { reviewQuoteContinueController } from './controller-post.js'
import getViewModel from './get-view-model.js'
import { routeId, routePath } from './route-path.js'
import { getQuoteDataFromCache } from '../../quote/helpers/quote-session-cache/index.js'
import { requestToUseSession } from '../helpers/request-to-use-session/index.js'

export { routePath }

// The page shows quote answers plus the NRL reference the heading names, which
// lives in the request to use session rather than the quote session.
const getReviewQuoteDetailsData = (request) => ({
  ...getQuoteDataFromCache(request),
  nrlReference: requestToUseSession.get(request)?.nrlReference
})

/**
 * @openapi
 * /request-to-use/review-quote-details:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Review and amend the quote details page
 *     description: Renders the quote details saved in the session for review after the retrieve quote email link is selected
 *     responses:
 *       200:
 *         description: HTML page listing the saved quote details
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *   post:
 *     tags:
 *       - RequestToUse
 *     summary: Continue from the review and amend the quote details page
 *     description: Redirects to the dropout page for an ineligible saved answer, or back to the review page
 *     responses:
 *       303:
 *         description: Redirect to a dropout page for an ineligible answer, or to the review page
 */
export default [
  {
    method: 'GET',
    path: routePath,
    ...requestToUseController({
      routeId,
      getViewModel,
      getSessionData: getReviewQuoteDetailsData
    })
  },
  {
    method: 'POST',
    path: routePath,
    options: {
      // The Continue form posts no fields (the crumb plugin strips csrfToken
      // before validation), so the schema is an empty object.
      validate: {
        payload: joi.object()
      }
    },
    ...reviewQuoteContinueController
  }
]
