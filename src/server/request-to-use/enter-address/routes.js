import { requestToUseController } from '../controller-get.js'
import { createPostController } from '../../common/controllers/post-controller.js'
import { saveEnterAddress } from '../helpers/request-to-use-session/index.js'
import getViewModel from './get-view-model.js'
import { getSessionData } from './get-session-data.js'
import formValidation from './form-validation.js'
import getNextPage from './get-next-page.js'
import { routeId, routePath } from './route-path.js'

export { routePath }

const postController = createPostController({
  formValidation,
  getNextPage,
  saveToSession: saveEnterAddress
})

/**
 * @openapi
 * /request-to-use/enter-address:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Enter address page
 *     description: Renders the Enter address page in one of three variants (developer details, individual address or organisation address) chosen by the user's account context. The user must be signed in with Defra ID.
 *     responses:
 *       200:
 *         description: HTML page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       302:
 *         description: Redirect to Defra ID sign-in if not authenticated
 *   post:
 *     tags:
 *       - RequestToUse
 *     summary: Submit the enter address form
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - formVariant
 *               - addressLine1
 *               - townOrCity
 *               - postcode
 *             properties:
 *               formVariant:
 *                 type: string
 *                 enum:
 *                   - individual
 *                   - organisation
 *                   - agent
 *               fullName:
 *                 type: string
 *                 description: Required when the variant is agent
 *               addressLine1:
 *                 type: string
 *               addressLine2:
 *                 type: string
 *               townOrCity:
 *                 type: string
 *               county:
 *                 type: string
 *               postcode:
 *                 type: string
 *     responses:
 *       303:
 *         description: Redirect to the review page for the variant, or back to the form on validation failure
 */
export default [
  {
    method: 'GET',
    path: routePath,
    rules: { requireAuth: true },
    ...requestToUseController({
      routeId,
      getViewModel,
      getSessionData
    })
  },
  {
    method: 'POST',
    path: routePath,
    rules: { requireAuth: true },
    options: postController.options,
    handler: postController.handler
  }
]
