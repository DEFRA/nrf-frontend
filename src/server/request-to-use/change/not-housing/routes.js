import { quoteController } from '../../../quote/controller-get.js'
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
    // The routeId is the quote page's template dir: this route renders the
    // quote dropout page itself under the request to use prefix.
    ...quoteController({ routeId: 'not-housing', getViewModel })
  }
]
