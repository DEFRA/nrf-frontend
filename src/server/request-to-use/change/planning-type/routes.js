import { quoteController } from '../../../quote/controller-get.js'
import { createPostController } from '../../../common/controllers/post-controller.js'
import formValidation from '../../../quote/planning-type/form-validation.js'
import getNextPage from '../../../quote/planning-type/get-next-page.js'
import { saveQuoteDataToCache } from '../../../quote/helpers/quote-session-cache/index.js'
import { redirectToReviewPageUnlessDropout } from '../../helpers/change-answer/index.js'
import getViewModel from './get-view-model.js'
import { routePath } from './route-path.js'

export { routePath }

/**
 * @openapi
 * /request-to-use/change/planning-type:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Change planning application type page
 *     description: Renders the quote journey's planning application type form to edit the answer from the review and amend your quote details page
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
 *     summary: Submit a changed planning application type
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - planningType
 *             properties:
 *               planningType:
 *                 type: string
 *                 enum:
 *                   - full-planning-permission
 *                   - outline-planning-permission
 *                   - hybrid-planning-permission
 *                   - other
 *     responses:
 *       303:
 *         description: Redirect to the review and amend page on success, to the dropout page for an ineligible answer, or back to the form on validation failure
 */
export default [
  {
    method: 'GET',
    path: routePath,
    // The routeId is the quote page's template dir: this route renders the
    // quote question page itself under the request to use prefix.
    ...quoteController({ routeId: 'planning-type', getViewModel })
  },
  {
    method: 'POST',
    path: routePath,
    ...createPostController({
      formValidation,
      getNextPage,
      saveToSession: saveQuoteDataToCache,
      resolveRedirect: redirectToReviewPageUnlessDropout
    })
  }
]
