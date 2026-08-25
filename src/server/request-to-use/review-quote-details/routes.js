import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'review-quote-details'
export const routeReviewQuoteDetails = '/request-to-use/review-quote-details'

/**
 * @openapi
 * /request-to-use/review-quote-details:
 *   get:
 *     tags:
 *       - Request to use
 *     summary: Review quote details page
 *     description: Renders the page for reviewing and amending quote details before requesting to use the levy
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
    path: routeReviewQuoteDetails,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeReviewQuoteDetails,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
