import { requestToUseController } from '../../controller-get.js'
import { createPostController } from '../../../common/controllers/post-controller.js'
import { requestToUseSession } from '../../helpers/request-to-use-session/index.js'
import { routePath as checkYourAnswersPath } from '../../check-your-answers/route-path.js'
import getViewModel from './get-view-model.js'
import formValidation from '../../variation/form-validation.js'
import getNextPage from '../../variation/get-next-page.js'
import { saveVariation } from '../../variation/save-to-session.js'
import { routePath as changeOriginalCommittedPath } from '../original-committed/route-path.js'
import { routePath } from './route-path.js'

export { routePath }

const postController = createPostController({
  formValidation,
  getNextPage,
  saveToSession: saveVariation,
  // Changing to yes with no original permission answers (never given, or
  // discarded by an earlier no) continues through them before returning.
  resolveRedirect: ({ request }) =>
    requestToUseSession.get(request)?.variation === 'yes' &&
    requestToUseSession.get(request)?.originalCommitted === undefined
      ? changeOriginalCommittedPath
      : checkYourAnswersPath
})

/**
 * @openapi
 * /request-to-use/change/variation:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Change page for "Is the development an amendment to an existing planning permission?"
 *     description: Renders the variation page to edit the answer from the check your answers page
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
 *     summary: Submit the changed answer
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - variation
 *             properties:
 *               variation:
 *                 type: string
 *                 enum:
 *                   - 'yes'
 *                   - 'no'
 *     responses:
 *       303:
 *         description: Redirect to the check your answers page on success, or back to the form on validation failure
 */
export default [
  {
    method: 'GET',
    path: routePath,
    ...requestToUseController({ routeId: 'variation', getViewModel })
  },
  {
    method: 'POST',
    path: routePath,
    ...postController
  }
]
