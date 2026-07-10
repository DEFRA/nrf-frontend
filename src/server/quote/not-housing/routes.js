import { quoteController } from '../controller-get.js'
import getViewModel from './get-view-model.js'

const routeId = 'not-housing'
export const routePath = '/quote/not-housing'

/**
 * @openapi
 * /quote/not-housing:
 *   get:
 *     tags:
 *       - Quote
 *     summary: Not housing information page
 *     description: Renders an informational page when the development is not housing
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
    ...quoteController({ routeId, getViewModel })
  }
]
