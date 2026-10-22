import { quoteController } from '../../../quote/controller-get.js'
import { createPostController } from '../../../common/controllers/post-controller.js'
import getConfirmHousingViewModel from '../../../quote/confirm-housing/get-view-model.js'
import formValidation from '../../../quote/confirm-housing/form-validation.js'
import getNextPage from '../../../quote/confirm-housing/get-next-page.js'
import { saveQuoteDataToCache } from '../../../quote/helpers/quote-session-cache/index.js'
import { isDropoutPage } from '../../../quote/helpers/change-mode/index.js'
import { routePath as reviewQuoteDetailsPath } from '../../review-quote-details/route-path.js'
import { routePath } from './route-path.js'

export { routePath }

/**
 * The alias serves the quote question page's own template, so the view model
 * spreads the quote page's and only swaps the back link: an edit from the
 * review page returns there, not to the quote journey's previous page.
 * @param {object} quoteData - the quote session data
 * @param {object} query - the parsed request query
 * @returns {object} view model for the change confirm housing page
 */
const getViewModel = (quoteData, query) => ({
  ...getConfirmHousingViewModel(quoteData, query),
  backLinkPath: reviewQuoteDetailsPath
})

/**
 * A saved edit returns to the review page rather than continuing the quote
 * journey. Dropout pages still win: an ineligible answer must show its dropout
 * page (their behaviour when reached from a change link is NRF2-1314).
 * @param {{ nextPage: string }} params
 * @returns {string} redirect path
 */
const resolveRedirect = ({ nextPage }) =>
  isDropoutPage(nextPage) ? nextPage : reviewQuoteDetailsPath

/**
 * @openapi
 * /request-to-use/change/confirm-housing:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Change housing page
 *     description: Renders the quote journey's housing question form to edit the answer from the review and amend your quote details page
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
 *     summary: Submit a changed housing answer
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - isHousing
 *             properties:
 *               isHousing:
 *                 type: string
 *                 enum:
 *                   - yes
 *                   - no
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
    ...quoteController({ routeId: 'confirm-housing', getViewModel })
  },
  {
    method: 'POST',
    path: routePath,
    ...createPostController({
      formValidation,
      getNextPage,
      saveToSession: saveQuoteDataToCache,
      resolveRedirect
    })
  }
]
