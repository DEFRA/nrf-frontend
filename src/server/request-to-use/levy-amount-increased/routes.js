import { requestToUseController } from '../controller-get.js'
import { quotePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'levy-amount-increased'
export const routeLevyAmountIncreased = '/request-to-use/levy-amount-increased'

/**
 * @openapi
 * /request-to-use/levy-amount-increased:
 *   get:
 *     tags:
 *       - Request to use
 *     summary: Levy amount increased page
 *     description: Renders the page asking whether to accept the inflation-adjusted levy amount
 *     responses:
 *       200:
 *         description: HTML form page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
export default [
  {
    method: 'GET',
    path: routeLevyAmountIncreased,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeLevyAmountIncreased,
    ...quotePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
