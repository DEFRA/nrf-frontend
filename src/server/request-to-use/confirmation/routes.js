import { requestToUseController } from '../controller-get.js'
import getViewModel from './get-view-model.js'
import { routeId, routePath } from './route-path.js'

export { routePath }

/**
 * @openapi
 * /request-to-use/confirmation:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Your details have been submitted page
 *     description: Renders the confirmation page shown after the request to use the levy is submitted from the check your answers page. The user must be signed in with Defra ID and have a request to use session.
 *     responses:
 *       200:
 *         description: HTML confirmation page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       302:
 *         description: Redirect to Defra ID sign-in if not authenticated, or to the start page without a valid session
 */
export default [
  {
    method: 'GET',
    path: routePath,
    rules: { requireAuth: true },
    ...requestToUseController({ routeId, getViewModel })
  }
]
