import joi from 'joi'
import { requestToUseController } from '../controller-get.js'
import getViewModel from './get-view-model.js'
import { checkYourAnswersPostController } from './controller-post.js'
import { routeId, routePath } from './route-path.js'

export { routePath }

/**
 * @openapi
 * /request-to-use/check-your-answers:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Check your answers page
 *     description: Holding page with a button to submit the request to use the levy. Without a valid request to use session it redirects to the start page.
 *     responses:
 *       200:
 *         description: HTML page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       302:
 *         description: Redirect to the start page without a valid session
 *   post:
 *     tags:
 *       - RequestToUse
 *     summary: Submit the request to use the levy
 *     description: Records on the quote in the backend that the commitment certificate has been created, then redirects to the confirmation page. Without a valid session it redirects to the start page.
 *     responses:
 *       303:
 *         description: Redirect to the confirmation page, or to the start page without a valid session
 *       500:
 *         description: The backend call failed
 */
export default [
  {
    method: 'GET',
    path: routePath,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routePath,
    options: { validate: { payload: joi.object({}) } },
    ...checkYourAnswersPostController
  }
]
