import { manageController } from '../controller-get.js'
import getViewModel from './get-view-model.js'
import { initQuoteSession } from '../../quote/helpers/quote-session-cache/index.js'
import { routePath as whatWouldYouLikeToDoPath } from '../what-would-you-like-to-do/route-path.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { routePath } from './route-path.js'

const routeId = 'start-page'

export { routePath }

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
 *         description: Redirect to the what would you like to do page
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
      return h
        .redirect(whatWouldYouLikeToDoPath)
        .code(statusCodes.redirectAfterPost)
    }
  }
]
