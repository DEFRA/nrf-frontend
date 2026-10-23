import { quoteController } from '../../../quote/controller-get.js'
import { createPostController } from '../../../common/controllers/post-controller.js'
import formValidation from '../../../quote/unit-number/form-validation.js'
import getNextPage from '../../../quote/unit-number/get-next-page.js'
import { saveQuoteDataToCache } from '../../../quote/helpers/quote-session-cache/index.js'
import { redirectToReviewPageUnlessDropout } from '../../helpers/change-answer/index.js'
import getViewModel from './get-view-model.js'
import { routePath } from './route-path.js'

export { routePath }

/**
 * @openapi
 * /request-to-use/change/unit-number:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Change number of housing units page
 *     description: Renders the quote journey's housing units form to edit the answer from the review and amend your quote details page
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
 *     summary: Submit a changed number of housing units
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - housingUnits
 *             properties:
 *               housingUnits:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 15780
 *     responses:
 *       303:
 *         description: Redirect to the review and amend page on success or back to the form on validation failure
 */
export default [
  {
    method: 'GET',
    path: routePath,
    // The routeId is the quote page's template dir: this route renders the
    // quote question page itself under the request to use prefix.
    ...quoteController({ routeId: 'unit-number', getViewModel })
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
