import { quoteController } from '../../../quote/controller-get.js'
import { redirectToFormWithValidationErrors } from '../../../common/helpers/redirect-to-form-with-validation-errors.js'
import formValidation from '../../../quote/delete-quote/form-validation.js'
import { deleteQuotePostController } from '../../delete-quote/controller-post.js'
import getViewModel from './get-view-model.js'
import { routePath } from './route-path.js'

export { routePath }

/**
 * @openapi
 * /request-to-use/change/delete-quote:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Are you sure you want to delete this quote page
 *     description: Renders the quote journey's delete quote page when the Delete quote details link on the check your answers page is followed or the levy amount is declined on the change accept levy page. The back link and Cancel link return to the change accept levy page.
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
 *     description: Deletes the quote from the backend, clears the journey session and redirects to the delete quote confirmation page; without a valid session it redirects to the start page
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
 *         description: Redirect to the delete quote confirmation page, back to the form on validation failure, or to the start page without a valid session
 */
export default [
  {
    method: 'GET',
    path: routePath,
    // The routeId is the quote page's template dir: this route renders the
    // quote delete quote page itself under the request to use change prefix.
    ...quoteController({ routeId: 'delete-quote', getViewModel })
  },
  {
    method: 'POST',
    path: routePath,
    options: {
      validate: {
        payload: formValidation(),
        failAction: redirectToFormWithValidationErrors
      }
    },
    ...deleteQuotePostController
  }
]
