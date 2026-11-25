import { requestToUseController } from '../controller-get.js'
import getViewModel from './get-view-model.js'
import { redirectWhenAnswersIncomplete } from './redirect-when-answers-incomplete.js'
import { routeId, routePath } from './route-path.js'

export { routePath }

const getController = requestToUseController({
  routeId,
  getViewModel
})

/**
 * @openapi
 * /request-to-use/read-this:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Details to read before you request to use the nature restoration levy page
 *     description: Renders the commitment certificate details, recalculated levy amounts and planning conditions before check your answers. The user must be signed in with Defra ID and have accepted the levy calculation and entered and confirmed their details.
 *     responses:
 *       200:
 *         description: HTML content page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       302:
 *         description: Redirect to Defra ID sign-in if not authenticated, to the start page without a valid session, or to the review and amend page when an earlier step is incomplete
 */
export default [
  {
    method: 'GET',
    path: routePath,
    rules: { requireAuth: true },
    options: { pre: [{ method: redirectWhenAnswersIncomplete }] },
    ...getController
  }
]
