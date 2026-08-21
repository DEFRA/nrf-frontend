import { requestToUseController } from '../controller-get.js'
import { quotePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'developer-details'
export const routeDeveloperDetails = '/request-to-use/developer-details'

/**
 * @openapi
 * /request-to-use/developer-details:
 *   get:
 *     tags:
 *       - Request to use
 *     summary: Developer details page
 *     description: Renders the developer details form for the nature restoration levy
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
    path: routeDeveloperDetails,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeDeveloperDetails,
    ...quotePostController({ routeId, getViewModel, getNextPage })
  }
]
