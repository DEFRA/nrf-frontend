import { quoteController } from '../controller-get.js'
import getViewModel from './get-view-model.js'

const routeId = 'delete-quote-confirmation'
export const routePath = `/quote/${routeId}`

/**
 * @openapi
 * /quote/delete-quote-confirmation:
 *   get:
 *     tags:
 *       - Quote
 *     summary: Delete quote confirmation page
 *     description: Renders the page shown after a quote has been successfully deleted
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
