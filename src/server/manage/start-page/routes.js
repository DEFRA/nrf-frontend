import { manageController } from '../controller-get.js'
import getViewModel from './get-view-model.js'
import { initQuoteSession } from '../../quote/helpers/quote-session-cache/index.js'
import { routePath as planningTypePath } from '../../quote/planning-type/routes.js'
import { statusCodes } from '../../common/constants/status-codes.js'

const routeId = 'start-page'
export const routePath = '/manage/start-page'

/**
 * @openapi
 * /manage/start-page:
 *   get:
 *     tags:
 *       - Manage
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
 *       - Manage
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
    ...manageController({ routeId, getViewModel })
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
