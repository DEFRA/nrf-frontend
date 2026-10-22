import { quoteController } from '../../../quote/controller-get.js'
import { createPostController } from '../../../common/controllers/post-controller.js'
import formValidation from '../../../quote/boundary-type/form-validation.js'
import getNextPage from '../../../quote/boundary-type/get-next-page.js'
import getViewModel from './get-view-model.js'
import resolveRedirect from './resolve-redirect.js'
import saveBoundaryEntryTypeToCache from './save-to-session.js'
import { routePath } from './route-path.js'

export { routePath }

/**
 * @openapi
 * /request-to-use/change/boundary-type:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Change boundary type page
 *     description: Renders the quote journey's boundary entry type form to edit the answer from the review and amend your quote details page
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
 *     summary: Submit a changed boundary type
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - boundaryEntryType
 *             properties:
 *               boundaryEntryType:
 *                 type: string
 *                 enum:
 *                   - draw
 *                   - upload
 *     responses:
 *       303:
 *         description: Redirect to the change draw boundary or change upload boundary page on success, or back to the form on validation failure
 */
export default [
  {
    method: 'GET',
    path: routePath,
    // The routeId is the quote page's template dir: this route renders the
    // quote question page itself under the request to use prefix.
    ...quoteController({ routeId: 'boundary-type', getViewModel })
  },
  {
    method: 'POST',
    path: routePath,
    ...createPostController({
      formValidation,
      getNextPage,
      saveToSession: saveBoundaryEntryTypeToCache,
      resolveRedirect
    })
  }
]
