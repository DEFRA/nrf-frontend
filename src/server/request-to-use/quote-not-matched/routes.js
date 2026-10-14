import { requestToUseController } from '../controller-get.js'
import getViewModel from './get-view-model.js'
import { routePath } from './route-path.js'

const routeId = 'quote-not-matched'

export { routePath }

/**
 * @openapi
 * /request-to-use/quote-not-matched:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: These details do not match our records page
 *     description: Renders the dropout page shown when the email address and NRL reference do not match a quote
 *     responses:
 *       200:
 *         description: HTML dropout page
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
