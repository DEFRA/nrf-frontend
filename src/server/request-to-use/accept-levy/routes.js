import { requestToUseController } from '../controller-get.js'
import { requestToUseSession } from '../helpers/request-to-use-session/index.js'
import { createPostController } from '../../common/controllers/post-controller.js'
import { isChangeMode } from '../../quote/helpers/change-mode/index.js'
import { routePath as checkYourAnswersPath } from '../check-your-answers/route-path.js'
import { routePath as deleteQuotePath } from '../delete-quote/route-path.js'
import getViewModel from './get-view-model.js'
import formValidation from './form-validation.js'
import getNextPage from './get-next-page.js'
import { routeId, routePath } from './route-path.js'

export { routePath }

/**
 * @openapi
 * /request-to-use/accept-levy:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Do you accept this nature restoration levy amount page
 *     description: Renders the recalculated levy amounts and asks whether the user accepts them
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
 *     summary: Submit whether you accept the nature restoration levy amount
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - acceptLevy
 *             properties:
 *               acceptLevy:
 *                 type: string
 *                 enum:
 *                   - 'yes'
 *                   - 'no'
 *     responses:
 *       303:
 *         description: Redirect to the next page on success, to the check your answers page when the change flag is set, or back to the form on validation failure
 */
export default [
  {
    method: 'GET',
    path: routePath,
    ...requestToUseController({
      routeId,
      getViewModel
    })
  },
  {
    method: 'POST',
    path: routePath,
    ...createPostController({
      formValidation,
      getNextPage,
      saveToSession: requestToUseSession.save,
      // An edit from the check your answers page returns there, but
      // declining the levy amount still takes the delete quote path: the
      // deliberate destructive answer wins over the return.
      resolveRedirect: ({ nextPage, request }) =>
        nextPage === deleteQuotePath || !isChangeMode(request.query)
          ? nextPage
          : checkYourAnswersPath
    })
  }
]
