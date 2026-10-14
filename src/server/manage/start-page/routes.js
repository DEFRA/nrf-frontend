import { manageController } from '../controller-get.js'
import getViewModel from './get-view-model.js'
import { clearAllSessionData } from '../../common/helpers/journey-session/index.js'
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
 *     summary: Reset the session
 *     description: Clears every answer stored in the session and redirects to the first step
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
      clearAllSessionData(request)
      return h
        .redirect(whatWouldYouLikeToDoPath)
        .code(statusCodes.redirectAfterPost)
    }
  }
]
