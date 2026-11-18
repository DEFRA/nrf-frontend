import { requestToUseController } from '../../controller-get.js'
import { requestToUseSession } from '../../helpers/request-to-use-session/index.js'
import { createPostController } from '../../../common/controllers/post-controller.js'
import { routePath as checkYourAnswersPath } from '../../check-your-answers/route-path.js'
import { routePath as deleteQuotePath } from '../../delete-quote/route-path.js'
import { routePath as changeDeleteQuotePath } from '../delete-quote/route-path.js'
import getViewModel from './get-view-model.js'
import formValidation from '../../accept-levy/form-validation.js'
import getNextPage from '../../accept-levy/get-next-page.js'
import { routePath } from './route-path.js'

export { routePath }

const postController = createPostController({
  formValidation,
  getNextPage,
  saveToSession: requestToUseSession.save,
  // An edit returns to the check your answers page, but declining the levy
  // amount still takes the delete quote path — the deliberate destructive
  // answer wins over the return — at its own change alias, whose back link
  // also returns to the check your answers page.
  resolveRedirect: ({ nextPage }) =>
    nextPage === deleteQuotePath ? changeDeleteQuotePath : checkYourAnswersPath
})

/**
 * @openapi
 * /request-to-use/change/accept-levy:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Change whether the levy amount is accepted page
 *     description: Renders the accept levy page to edit the answer from the check your answers page
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
 *     summary: Submit whether the levy amount is accepted
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
 *         description: Redirect to the check your answers page on success, to the change delete quote page when the levy amount is declined, or back to the form on validation failure
 */
export default [
  {
    method: 'GET',
    path: routePath,
    // The routeId is the accept levy page's template dir: this route renders
    // the accept levy page itself under the change prefix.
    ...requestToUseController({ routeId: 'accept-levy', getViewModel })
  },
  {
    method: 'POST',
    path: routePath,
    ...postController
  }
]
