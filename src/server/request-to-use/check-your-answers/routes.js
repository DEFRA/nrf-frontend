import { requestToUseController } from '../controller-get.js'
import { redirectToFormWithValidationErrors } from '../../common/helpers/redirect-to-form-with-validation-errors.js'
import getViewModel from './get-view-model.js'
import formValidation from './form-validation.js'
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
 *     description: Renders the answers given in the request to use journey for checking before the request is submitted. The user must be signed in with Defra ID. Without a valid request to use session it redirects to the start page.
 *     responses:
 *       200:
 *         description: HTML page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       302:
 *         description: Redirect to Defra ID sign-in if not authenticated, or to the start page without a valid session
 *   post:
 *     tags:
 *       - RequestToUse
 *     summary: Submit the request to use the levy
 *     description: Records on the quote in the backend that the commitment certificate has been created, then redirects to the confirmation page. Without a valid request to use session it redirects to the start page.
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - confirmInformation
 *             properties:
 *               confirmInformation:
 *                 type: string
 *                 enum:
 *                   - 'Yes'
 *     responses:
 *       303:
 *         description: Redirect to the confirmation page, back to the form on validation failure, or to the start page without a valid session
 *       500:
 *         description: The backend call failed
 */
export default [
  {
    method: 'GET',
    path: routePath,
    rules: { requireAuth: true },
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routePath,
    rules: { requireAuth: true },
    options: {
      validate: {
        payload: formValidation(),
        failAction: redirectToFormWithValidationErrors
      }
    },
    ...checkYourAnswersPostController
  }
]
