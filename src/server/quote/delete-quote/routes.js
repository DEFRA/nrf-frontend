import { quoteController } from '../controller-get.js'
import getViewModel from './get-view-model.js'
import { deleteSubmitController } from './controller-post.js'

const routeId = 'delete-quote'
export const routePath = '/quote/delete-quote'

/**
 * @openapi
 * /quote/delete-quote:
 *   get:
 *     tags:
 *       - Quote
 *     summary: Delete quote confirmation page
 *     description: Renders the delete quote confirmation page
 *     responses:
 *       200:
 *         description: HTML form page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *   post:
 *     tags:
 *       - Quote
 *     summary: Submit delete quote confirmation
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - confirmDeleteQuote
 *             properties:
 *               confirmDeleteQuote:
 *                 type: string
 *                 enum:
 *                   - Yes
 *     responses:
 *       303:
 *         description: Redirect to next step on success or back to form on validation failure
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
    ...deleteSubmitController
  }
]
