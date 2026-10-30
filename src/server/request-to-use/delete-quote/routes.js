import { quoteController } from '../../quote/controller-get.js'
import { createPostController } from '../../common/controllers/post-controller.js'
import formValidation from '../../quote/delete-quote/form-validation.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'
import { routePath } from './route-path.js'
import { clearAllSessionData } from '../../common/helpers/journey-session/index.js'

export { routePath }

// Clears the session so browser back from the confirmation page reaches the
// session guard on this page and is redirected to the start page.
const clearSessionOnDelete = (request, payload) => {
  clearAllSessionData(request)
  return payload
}

/**
 * @openapi
 * /request-to-use/delete-quote:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Are you sure you want to delete this quote page
 *     description: Renders the quote journey's delete quote page when the levy amount is declined on the accept levy page
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
 *     summary: Submit the delete quote decision
 *     description: Redirects to the delete quote confirmation page; the quote data itself is deleted separately
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - confirmDeleteQuote
 *             properties:
 *               confirmDeleteQuote:
 *                 type: string
 *                 enum:
 *                   - 'Yes'
 *     responses:
 *       303:
 *         description: Redirect to the delete quote confirmation page, or back to the form on validation failure
 */
export default [
  {
    method: 'GET',
    path: routePath,
    // The routeId is the quote page's template dir: this route renders the
    // quote delete quote page itself under the request to use prefix.
    ...quoteController({ routeId: 'delete-quote', getViewModel })
  },
  {
    method: 'POST',
    path: routePath,
    ...createPostController({
      formValidation,
      getNextPage,
      saveToSession: clearSessionOnDelete
    })
  }
]
