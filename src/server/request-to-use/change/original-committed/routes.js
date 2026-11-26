import { requestToUseController } from '../../controller-get.js'
import { createPostController } from '../../../common/controllers/post-controller.js'
import getViewModel from './get-view-model.js'
import formValidation from '../../original-committed/form-validation.js'
import getNextPage from '../../original-committed/get-next-page.js'
import { saveOriginalCommitted } from '../../original-committed/save-to-session.js'
import resolveRedirect from './resolve-redirect.js'
import { routePath } from './route-path.js'

export { routePath }

const postController = createPostController({
  formValidation,
  getNextPage,
  saveToSession: saveOriginalCommitted,
  resolveRedirect
})

/**
 * @openapi
 * /request-to-use/change/original-committed:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Change page for "Was the original planning permission committed to using the nature restoration levy?"
 *     description: Renders the original-committed page to edit the answer from the check your answers page
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
 *               - originalCommitted
 *             properties:
 *               originalCommitted:
 *                 type: string
 *                 enum:
 *                   - 'yes'
 *                   - 'no'
 *     responses:
 *       303:
 *         description: Redirect to the original reference change page when the answer is yes and there is no reference, to the check your answers page otherwise, or back to the form on validation failure
 */
export default [
  {
    method: 'GET',
    path: routePath,
    ...requestToUseController({ routeId: 'original-committed', getViewModel })
  },
  {
    method: 'POST',
    path: routePath,
    ...postController
  }
]
