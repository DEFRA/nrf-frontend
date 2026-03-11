import { quoteController } from '../controller-get.js'
import { quoteSubmitController } from './controller-post.js'
import getViewModel from './get-view-model.js'

const routeId = 'check-your-answers'
export const routePath = `/quote/${routeId}`

/**
 * @openapi
 * /quote/check-your-answers:
 *   get:
 *     tags:
 *       - Quote
 *     summary: Check your answers page
 *     description: Renders the quote summary page for review before submission
 *     responses:
 *       200:
 *         description: HTML summary page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *   post:
 *     tags:
 *       - Quote
 *     summary: Submit quote
 *     description: Submits the quote to the backend API
 *     responses:
 *       303:
 *         description: Redirect to confirmation page with reference number
 */
export default [
  {
    method: 'GET',
    path: routePath,
    ...quoteController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routePath,
    ...quoteSubmitController
  }
]
