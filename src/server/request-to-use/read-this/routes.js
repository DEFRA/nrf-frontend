import { requestToUseController } from '../controller-get.js'
import { requestToUseSession } from '../helpers/request-to-use-session/index.js'
import getViewModel from './get-view-model.js'
import { routeId, routePath } from './route-path.js'

export { routePath }

/**
 * @openapi
 * /request-to-use/read-this:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Details to read before you request to use the nature restoration levy page
 *     description: Renders the commitment certificate details, recalculated levy amounts and planning conditions before check your answers
 *     responses:
 *       200:
 *         description: HTML content page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
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
