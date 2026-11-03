import { requestToUseController } from '../controller-get.js'
import { requestToUseSession } from '../helpers/request-to-use-session/index.js'
import getViewModel from './get-view-model.js'
import { routePath } from './route-path.js'

const routeId = 'original-reference-not-matched'

export { routePath }

/**
 * @openapi
 * /request-to-use/original-reference-not-matched:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: NRL reference does not match our records page
 *     description: Renders the dropout page shown when the original NRL reference does not match a record
 *     responses:
 *       200:
 *         description: HTML dropout page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       302:
 *         description: Redirects to the start page when the session is not valid
 */
export default [
  {
    method: 'GET',
    path: routePath,
    ...requestToUseController({
      routeId,
      getViewModel,
      getSessionData: requestToUseSession.get
    })
  }
]
