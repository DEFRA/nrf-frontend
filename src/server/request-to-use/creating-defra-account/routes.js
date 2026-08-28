import { creatingDefraAccountGetController } from './controller-get.js'
import getViewModel from './get-view-model.js'

const routeId = 'creating-defra-account'
export const routePath = '/request-to-use/creating-defra-account'

/**
 * @openapi
 * /request-to-use/creating-defra-account:
 *   get:
 *     tags:
 *       - Request to use
 *     summary: Create Defra account page
 *     description: Renders the page for creating a Defra account
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
    ...creatingDefraAccountGetController({ routeId, getViewModel })
  }
]
