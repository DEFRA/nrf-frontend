import { quoteController } from '../../../quote/controller-get.js'
import { createPostController } from '../../../common/controllers/post-controller.js'
import getPlanningTypeViewModel from '../../../quote/planning-type/get-view-model.js'
import formValidation from '../../../quote/planning-type/form-validation.js'
import getNextPage from '../../../quote/planning-type/get-next-page.js'
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
 * @returns {object} view model for the change planning type page
 */
const getViewModel = (quoteData, query) => ({
  ...getPlanningTypeViewModel(quoteData, query),
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
      resolveRedirect
    })
  }
]
