import { manageController } from '../controller-get.js'
import { manageQuestionPostController } from './controller-post.js'
import getViewModel from './get-view-model.js'
import formValidation from './form-validation.js'
import getNextPage from './get-next-page.js'
import { routePath } from './route-path.js'

const routeId = 'what-would-you-like-to-do'

export { routePath }

/**
 * @openapi
 * /manage/what-would-you-like-to-do:
 *   get:
 *     tags:
 *       - Manage
 *     summary: What would you like to do page
 *     description: Renders the choice between getting a quote and requesting to use the nature restoration levy
 *     responses:
 *       200:
 *         description: HTML form page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *   post:
 *     tags:
 *       - Manage
 *     summary: Submit what you would like to do
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - whatWouldYouLikeToDo
 *             properties:
 *               whatWouldYouLikeToDo:
 *                 type: string
 *                 enum:
 *                   - quote
 *                   - request-to-use
 *     responses:
 *       303:
 *         description: Redirect to the quote or request to use journey on success, or back to the form on validation failure
 */
export default [
  {
    method: 'GET',
    path: routePath,
    ...manageController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routePath,
    ...manageQuestionPostController({ formValidation, getNextPage })
  }
]
