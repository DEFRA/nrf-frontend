import { requestToUseController } from '../controller-get.js'
import { createPostController } from '../../common/controllers/post-controller.js'
import { saveDefraAccountUserType } from '../helpers/request-to-use-session/index.js'
import { redirectWhenSignedIn } from './redirect-when-signed-in.js'
import getViewModel from './get-view-model.js'
import { getSessionData } from './get-session-data.js'
import formValidation from './form-validation.js'
import getNextPage from './get-next-page.js'
import { routeId, routePath } from './route-path.js'

export { routePath }

const getController = requestToUseController({
  routeId,
  getViewModel,
  getSessionData
})
const postController = createPostController({
  formValidation,
  getNextPage,
  saveToSession: saveDefraAccountUserType
})

/**
 * @openapi
 * /request-to-use/defra-account-user-type:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Who are you requesting to use the nature restoration levy for page
 *     description: Renders the question asking who the user is requesting to use the levy for. Redirects to enter address when the user is already signed in.
 *     responses:
 *       200:
 *         description: HTML form page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       302:
 *         description: Redirect to enter address when signed in, or to the start page without a review quote session
 *   post:
 *     tags:
 *       - RequestToUse
 *     summary: Submit who you are requesting to use the nature restoration levy for
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - defraAccountUserType
 *             properties:
 *               defraAccountUserType:
 *                 type: string
 *                 enum:
 *                   - individual
 *                   - organisation
 *                   - agent
 *     responses:
 *       303:
 *         description: Redirect to the matching Defra account page on success, to enter address when signed in, or back to the form on validation failure
 */
export default [
  {
    method: 'GET',
    path: routePath,
    options: { pre: [{ method: redirectWhenSignedIn }] },
    ...getController
  },
  {
    method: 'POST',
    path: routePath,
    options: {
      ...postController.options,
      pre: [{ method: redirectWhenSignedIn }]
    },
    handler: postController.handler
  }
]
