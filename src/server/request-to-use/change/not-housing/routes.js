import { quoteController } from '../../../quote/controller-get.js'
import { routeId } from '../../../quote/not-housing/route-path.js'
import getViewModel from './get-view-model.js'
import { routePath } from './route-path.js'

export { routePath }

/**
 * @openapi
 * /request-to-use/change/not-housing:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Not housing page
 *     description: Renders the quote journey's dropout page when a housing change on the review and amend your quote details page makes the development ineligible
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
    // Renders the quote dropout page's own template, under the request to use
    // prefix, via the quote page's routeId.
    ...quoteController({ routeId, getViewModel })
  }
]
