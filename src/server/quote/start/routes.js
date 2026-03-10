import { quoteController } from '../controller-get.js'
import getViewModel from './get-view-model.js'

const routeId = 'start'
export const routePath = '/'

/**
 * @openapi
 * /:
 *   get:
 *     tags:
 *       - Quote
 *     summary: Start page
 *     description: Renders the quote flow start page
 *     responses:
 *       200:
 *         description: HTML start page
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
