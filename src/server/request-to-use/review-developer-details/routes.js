import { requestToUseController } from '../controller-get.js'
import getViewModel from './get-view-model.js'

const routeId = 'review-developer-details'
export const routeReviewDeveloperDetails =
  '/request-to-use/review-developer-details'

/**
 * @openapi
 * /request-to-use/review-developer-details:
 *   get:
 *     tags:
 *       - Request to use
 *     summary: Review developer details page
 *     description: Renders the page for reviewing and confirming the developer details
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
    path: routeReviewDeveloperDetails,
    ...requestToUseController({ routeId, getViewModel })
  }
]
