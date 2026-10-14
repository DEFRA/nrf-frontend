import { manageController } from '../controller-get.js'
import { createPostController } from '../../common/controllers/post-controller.js'
import { manageSession } from '../helpers/manage-session/index.js'
import { selectJourney } from '../../common/helpers/journey-session/index.js'
import getViewModel from './get-view-model.js'
import formValidation from './form-validation.js'
import getNextPage from './get-next-page.js'
import { routePath } from './route-path.js'

const routeId = 'what-would-you-like-to-do'

/**
 * @param {import('@hapi/hapi').Request} request
 * @param {{ whatWouldYouLikeToDo: string }} payload - the validated payload
 * @returns {object | null} the saved what would you like to do data
 */
const saveWhatWouldYouLikeToDo = (request, { whatWouldYouLikeToDo }) =>
  selectJourney({ request, journey: whatWouldYouLikeToDo })

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
    ...manageController({
      routeId,
      getViewModel,
      getSessionData: manageSession.get
    })
  },
  {
    method: 'POST',
    path: routePath,
    ...createPostController({
      formValidation,
      getNextPage,
      saveToSession: saveWhatWouldYouLikeToDo
    })
  }
]
