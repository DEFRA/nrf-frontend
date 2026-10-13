import { requestToUseController } from '../controller-get.js'
import getViewModel from './get-view-model.js'
import { routePath } from './route-path.js'

const routeId = 'no-nrl-reference'

export { routePath }

/**
 * @openapi
 * /request-to-use/no-nrl-reference:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: You need a quote before you can request to use the nature restoration levy page
 *     description: Renders the dropout page shown when the user has no NRL reference
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
