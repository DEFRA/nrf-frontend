import { quoteController } from '../controller-get.js'
import getViewModel from './get-view-model.js'

const routeId = 'excluded-area'
export const routePath = '/quote/excluded-area'

/**
 * @openapi
 * /quote/excluded-area:
 *   get:
 *     tags:
 *       - Quote
 *     summary: Excluded area information page
 *     description: Renders an informational page when the development is within the excluded area of an EDP
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
