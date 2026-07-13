import { quoteController } from '../controller-get.js'
import getViewModel from './get-view-model.js'

const routeId = 'draw-boundary-datasets'
export const routePath = '/quote/draw-boundary-datasets'

/**
 * @openapi
 * /quote/draw-boundary-datasets:
 *   get:
 *     tags: [Quote]
 *     summary: Draw boundary map (datasets plugin example)
 *     description: Example map page rendering impact assessor layers using the interactive map datasets plugin
 *     responses:
 *       200:
 *         description: HTML map page
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
