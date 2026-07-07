import { quoteController } from '../controller-get.js'
import getViewModel from './get-view-model.js'

const routeId = 'application-type-not-available'
export const routePath = '/quote/application-type-not-available'

/**
 * @openapi
 * /quote/application-type-not-available:
 *   get:
 *     tags:
 *       - Quote
 *     summary: Application type not available page
 *     description: Renders an informational page when the nature restoration levy is not available for the planning application type
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
