import { requestToUseController } from '../controller-get.js'
import getViewModel from './get-view-model.js'
import { routePath } from './route-path.js'

const routeId = 'review-quote-details'

export { routePath }

/**
 * @openapi
 * /request-to-use/review-quote-details:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Review and amend your quote details page
 *     description: Renders the quote details saved in the session for review after the retrieve quote email link is selected
 *     responses:
 *       200:
 *         description: HTML page listing the saved quote details
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
export default [
  {
    method: 'GET',
    path: routePath,
    ...requestToUseController({ routeId, getViewModel })
  }
]
