import { requestToUseController } from '../controller-get.js'
import { haveNrlReferencePostController } from './controller-post.js'
import getViewModel from './get-view-model.js'
import formValidation from './form-validation.js'
import getNextPage from './get-next-page.js'
import { routePath } from './route-path.js'

const routeId = 'have-nrl-reference'

export { routePath }

/**
 * @openapi
 * /request-to-use/have-nrl-reference:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Do you have an NRL reference page
 *     description: Renders the question asking whether the user has an NRL reference
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
 *     summary: Submit whether you have an NRL reference
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - hasNrlReference
 *             properties:
 *               hasNrlReference:
 *                 type: string
 *                 enum:
 *                   - 'yes'
 *                   - 'no'
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
    ...haveNrlReferencePostController({ formValidation, getNextPage })
  }
]
