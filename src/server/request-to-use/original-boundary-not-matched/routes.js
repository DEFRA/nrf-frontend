import { requestToUseController } from '../controller-get.js'
import { requestToUseSession } from '../helpers/request-to-use-session/index.js'
import { redirectWithoutOriginalReference } from './redirect-without-original-reference.js'
import getViewModel from './get-view-model.js'
import { routeId, routePath } from './route-path.js'

export { routePath }

/**
 * @openapi
 * /request-to-use/original-boundary-not-matched:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Details do not match page
 *     description: Renders the dropout page shown when the red line boundary does not match the original NRL reference
 *     responses:
 *       200:
 *         description: HTML dropout page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       302:
 *         description: Redirects to the start page when the session is not valid, or to the original reference not found page when the session has no original NRL reference
 */
export default [
  {
    method: 'GET',
    path: routePath,
    options: { pre: [{ method: redirectWithoutOriginalReference }] },
    ...requestToUseController({
      routeId,
      getViewModel,
      getSessionData: requestToUseSession.get
    })
  }
]
