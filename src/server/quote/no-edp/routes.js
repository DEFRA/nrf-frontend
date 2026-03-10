import { quoteController } from '../controller-get.js'
import getViewModel from './get-view-model.js'

const routeId = 'no-edp'
export const routePath = '/quote/no-edp'

/**
 * @openapi
 * /quote/no-edp:
 *   get:
 *     tags:
 *       - Quote
 *     summary: No EDP information page
 *     description: Renders an informational page when no EDP applies
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
