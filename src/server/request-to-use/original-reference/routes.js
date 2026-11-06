import { requestToUseController } from '../controller-get.js'
import { redirectToFormWithValidationErrors } from '../../common/helpers/redirect-to-form-with-validation-errors.js'
import { originalReferencePostController } from './controller-post.js'
import getViewModel from './get-view-model.js'
import { getSessionData } from './get-session-data.js'
import formValidation from './form-validation.js'
import { routeId, routePath } from './route-path.js'

export { routePath }

/**
 * @openapi
 * /request-to-use/original-reference:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Enter the NRL reference for the original planning permission page
 *     description: Renders the question asking for the NRL reference of the original planning permission.
 *     responses:
 *       200:
 *         description: HTML form page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *   post:
 *     tags:
 *       - RequestToUse
 *     summary: Submit the NRL reference for the original planning permission
 *     description: >
 *       Validates the reference, saves it to the request to use session, asks
 *       the backend whether the boundary in the session matches the original
 *       quote's saved boundary, and redirects to the next page. Redirects to
 *       the start page when the session has no boundary.
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - originalReference
 *             properties:
 *               originalReference:
 *                 type: string
 *                 description: NRL- followed by six digits. Whitespace is trimmed and lowercase accepted.
 *                 example: NRL-123456
 *     responses:
 *       303:
 *         description: Redirect to the next page on success, or back to the form on validation failure
 */
export default [
  {
    method: 'GET',
    path: routePath,
    ...requestToUseController({
      routeId,
      getViewModel,
      getSessionData
    })
  },
  {
    method: 'POST',
    path: routePath,
    options: {
      validate: {
        payload: formValidation(),
        failAction: redirectToFormWithValidationErrors
      }
    },
    ...originalReferencePostController
  }
]
