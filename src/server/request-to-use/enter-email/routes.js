import { requestToUseController } from '../controller-get.js'
import { retrieveQuoteSession } from '../helpers/retrieve-quote-session/index.js'
import { enterEmailPostController } from './controller-post.js'
import getViewModel from './get-view-model.js'
import { routePath } from './route-path.js'

const routeId = 'enter-email'

export { routePath }

/**
 * @openapi
 * /request-to-use/enter-email:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Enter your email address page
 *     description: Renders the question asking for the email address to send the link to retrieve the quote to.
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
 *     summary: Submit the email address
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email address. Whitespace around it is trimmed; it must be 254 characters or fewer and contain no spaces.
 *                 example: name@example.com
 *     responses:
 *       303:
 *         description: Redirect to the email confirmation page when a quote matches the NRL reference and email, to the quote not matched page when none does, or back to the form on validation failure
 */
export default [
  {
    method: 'GET',
    path: routePath,
    ...requestToUseController({
      routeId,
      getViewModel,
      getSessionData: retrieveQuoteSession.get
    })
  },
  {
    method: 'POST',
    path: routePath,
    ...enterEmailPostController
  }
]
