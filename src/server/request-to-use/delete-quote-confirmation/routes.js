import { quoteController } from '../../quote/controller-get.js'
import getViewModel from './get-view-model.js'
import { routePath } from './route-path.js'

// The routeId is the quote page's template dir: this route renders the
// quote delete quote confirmation page itself under the request to use prefix.
const routeId = 'delete-quote-confirmation'

export { routePath }

/**
 * @openapi
 * /request-to-use/delete-quote-confirmation:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Your details have been deleted page
 *     description: Renders the confirmation page shown after a quote has been deleted in the request to use journey
 *     responses:
 *       200:
 *         description: HTML confirmation page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
export default [
  {
    method: 'GET',
    path: routePath,
    ...quoteController({ routeId, getViewModel })
  }
]
