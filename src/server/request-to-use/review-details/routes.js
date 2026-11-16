import joi from 'joi'
import { requestToUseController } from '../controller-get.js'
import { createPostController } from '../../common/controllers/post-controller.js'
import getViewModel from './get-view-model.js'
import { getSessionData } from './get-session-data.js'
import getNextPage from './get-next-page.js'
import { redirectWhenNoAddress } from './redirect-when-no-address.js'
import { routeId, routePath } from './route-path.js'

export { routePath }

const getController = requestToUseController({
  routeId,
  getViewModel,
  getSessionData
})

// The Confirm button submits no fields: there is nothing to validate, save or
// branch on, so the standard post controller with an empty schema is enough.
const postController = createPostController({
  formValidation: () => joi.object({}),
  getNextPage
})

/**
 * @openapi
 * /request-to-use/review-details:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Review and confirm the developer details page
 *     description: Renders the confirmed address details for review in one of three variants (developer details, your details with a business name or your details) chosen by the persona snapshot saved when the address was confirmed. The user must be signed in with Defra ID and have saved address answers.
 *     responses:
 *       200:
 *         description: HTML page listing the confirmed details
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       302:
 *         description: Redirect to Defra ID sign-in if not authenticated, or to the enter address page when no address is saved
 *   post:
 *     tags:
 *       - RequestToUse
 *     summary: Confirm the developer details
 *     description: Redirects to the details to read page. Nothing is saved: confirming only moves the journey on.
 *     responses:
 *       303:
 *         description: Redirect to the details to read page, or to the enter address page when no address is saved
 */
export default [
  {
    method: 'GET',
    path: routePath,
    rules: { requireAuth: true },
    options: { pre: [{ method: redirectWhenNoAddress }] },
    ...getController
  },
  {
    method: 'POST',
    path: routePath,
    rules: { requireAuth: true },
    options: {
      ...postController.options,
      pre: [{ method: redirectWhenNoAddress }]
    },
    handler: postController.handler
  }
]
