import { requestToUseController } from '../../controller-get.js'
import { redirectToFormWithValidationErrors } from '../../../common/helpers/redirect-to-form-with-validation-errors.js'
import { createOriginalReferencePostController } from '../../original-reference/controller-post.js'
import formValidation from '../../original-reference/form-validation.js'
import { routePath as checkYourAnswersPath } from '../../check-your-answers/route-path.js'
import { routePath as changeOriginalReferenceNotMatchedPath } from '../original-reference-not-matched/route-path.js'
import { routePath as changeOriginalBoundaryNotMatchedPath } from '../original-boundary-not-matched/route-path.js'
import getViewModel from './get-view-model.js'
import { routePath } from './route-path.js'

export { routePath }

/**
 * @openapi
 * /request-to-use/change/original-reference:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Change the NRL reference for the original planning permission page
 *     description: Renders the original reference page to edit the answer from the check your answers page
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
 *     summary: Submit the changed NRL reference for the original planning permission
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
 *                 example: NRL-123456
 *     responses:
 *       303:
 *         description: Redirect to the check your answers page when the reference and boundary match, to the not matched pages otherwise, or back to the form on validation failure
 */
export default [
  {
    method: 'GET',
    path: routePath,
    ...requestToUseController({ routeId: 'original-reference', getViewModel })
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
    ...createOriginalReferencePostController({
      nextPageAfterMatch: () => checkYourAnswersPath,
      referenceNotMatchedPath: changeOriginalReferenceNotMatchedPath,
      boundaryNotMatchedPath: changeOriginalBoundaryNotMatchedPath
    })
  }
]
