import { requestToUseController } from '../controller-get.js'
import getViewModel from './get-view-model.js'
import { getSessionData } from './get-session-data.js'
import { routeId, routePath } from './route-path.js'

export { routePath }

/**
 * @openapi
 * /request-to-use/enter-address:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Enter address page
 *     description: Renders the Enter address page. The user must be signed in with Defra ID.
 *     responses:
 *       200:
 *         description: HTML page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       302:
 *         description: Redirect to Defra ID sign-in if not authenticated
 */
export default [
  {
    method: 'GET',
    path: routePath,
    rules: { requireAuth: true },
    ...requestToUseController({
      routeId,
      getViewModel,
      getSessionData
    })
  }
]
