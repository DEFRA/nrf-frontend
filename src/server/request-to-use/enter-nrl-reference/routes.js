import { requestToUseController } from '../controller-get.js'
import { createPostController } from '../../common/controllers/post-controller.js'
import getViewModel from './get-view-model.js'
import formValidation from './form-validation.js'
import getNextPage from './get-next-page.js'
import { routePath } from './route-path.js'

const routeId = 'enter-nrl-reference'

export { routePath }

/**
 * @openapi
 * /request-to-use/enter-nrl-reference:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Enter your NRL reference page
 *     description: >
 *       Renders the question asking for the user's NRL reference. A valid
 *       reference in the nrlReference query parameter pre-fills the input; an
 *       invalid one is ignored. The reference is not PII but it is recorded in
 *       access logs when supplied in the URL.
 *     parameters:
 *       - in: query
 *         name: nrlReference
 *         required: false
 *         schema:
 *           type: string
 *           example: NRL-123456
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
 *     summary: Submit the NRL reference
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - nrlReference
 *             properties:
 *               nrlReference:
 *                 type: string
 *                 description: Quote reference, NRL- followed by six digits. Whitespace is trimmed, lowercase accepted, and six digits on their own are accepted and given the NRL- prefix.
 *                 example: NRL-123456
 *     responses:
 *       303:
 *         description: Redirect to the next page on success, or back to the form (keeping the query string) on validation failure
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
