import { requestToUseController } from '../../controller-get.js'
import { createPostController } from '../../../common/controllers/post-controller.js'
import { saveEnterAddress } from '../../helpers/request-to-use-session/index.js'
import getViewModel from './get-view-model.js'
import formValidation from '../../enter-address/form-validation.js'
import getNextPage from './get-next-page.js'
import { redirectWhenFormVariantMismatch } from '../../enter-address/redirect-when-form-variant-mismatch.js'
import { routePath } from './route-path.js'

export { routePath }

const postController = createPostController({
  formValidation,
  getNextPage,
  saveToSession: saveEnterAddress
})

/**
 * @openapi
 * /request-to-use/change/enter-address:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Change the address or full name page
 *     description: Renders the enter address page to edit the answer from the check your answers page. The user must be signed in with Defra ID.
 *     responses:
 *       200:
 *         description: HTML form page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       302:
 *         description: Redirect to Defra ID sign-in if not authenticated
 *   post:
 *     tags:
 *       - RequestToUse
 *     summary: Submit a changed address or full name
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
 *                   - employee
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
 *         description: Redirect to the check your answers page on success, or back to the form on validation failure or a stale or tampered variant field
 */
export default [
  {
    method: 'GET',
    path: routePath,
    rules: { requireAuth: true },
    // The routeId is the enter address page's template dir: this route renders
    // the enter address page itself under the change prefix.
    ...requestToUseController({ routeId: 'enter-address', getViewModel })
  },
  {
    method: 'POST',
    path: routePath,
    rules: { requireAuth: true },
    options: {
      ...postController.options,
      pre: [{ method: redirectWhenFormVariantMismatch }]
    },
    handler: postController.handler
  }
]
