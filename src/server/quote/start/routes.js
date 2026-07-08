import { quoteController } from '../controller-get.js'
import getViewModel from './get-view-model.js'
import { initQuoteSession } from '../helpers/quote-session-cache/index.js'
import { routePath as planningTypePath } from '../planning-type/routes.js'
import { statusCodes } from '../../common/constants/status-codes.js'

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
 *   post:
 *     tags:
 *       - Quote
 *     summary: Initialise quote session
 *     description: Creates an empty quote session and redirects to the first step
 *     responses:
 *       303:
 *         description: Redirect to planning type page
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
    handler(request, h) {
      initQuoteSession(request)
      return h.redirect(planningTypePath).code(statusCodes.redirectAfterPost)
    }
  }
]
