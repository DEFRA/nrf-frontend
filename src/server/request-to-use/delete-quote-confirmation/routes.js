import { requestToUseController } from '../controller-get.js'
import getViewModel from './get-view-model.js'
import { routePath } from './route-path.js'

const routeId = 'delete-quote-confirmation' // must match the page folder name

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
    ...requestToUseController({ routeId, getViewModel })
  }
]
