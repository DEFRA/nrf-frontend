import { requestToUseController } from '../controller-get.js'
import { createPostController } from '../../common/controllers/post-controller.js'
import getViewModel from './get-view-model.js'
import formValidation from './form-validation.js'
import getNextPage from './get-next-page.js'
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
 *       Validates the reference and redirects to the next page. The answer is
 *       not saved; matching it against the original commitment and the
 *       not-matched dropout are separate tickets (NRF2-1317, NRF2-1310).
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
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routePath,
    ...createPostController({ formValidation, getNextPage })
  }
]
