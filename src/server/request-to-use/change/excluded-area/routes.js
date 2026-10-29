import { quoteController } from '../../../quote/controller-get.js'
import { routeId } from '../../../quote/excluded-area/route-path.js'
import getViewModel from './get-view-model.js'
import { routePath } from './route-path.js'

export { routePath }

/**
 * @openapi
 * /request-to-use/change/excluded-area:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Excluded area page
 *     description: Renders the quote journey's dropout page when a boundary change on the review and amend your quote details page falls in an Environmental Delivery Plan exclusion zone
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
