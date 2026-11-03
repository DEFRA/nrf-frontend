import { requestToUseController } from '../controller-get.js'
import { requestToUseSession } from '../helpers/request-to-use-session/index.js'
import { createPostController } from '../../common/controllers/post-controller.js'
import getViewModel from './get-view-model.js'
import formValidation from './form-validation.js'
import getNextPage from './get-next-page.js'
import { routeId, routePath } from './route-path.js'

export { routePath }

/**
 * @openapi
 * /request-to-use/variation:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Is the development an amendment to an existing planning permission page
 *     description: Renders the form asking whether the development is an amendment to an existing planning permission
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
 *     summary: Submit whether the development is an amendment to an existing planning permission
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - variation
 *             properties:
 *               variation:
 *                 type: string
 *                 enum:
 *                   - 'yes'
 *                   - 'no'
 *     responses:
 *       303:
 *         description: Redirect to the next page on success, or back to the form on validation failure
 */
export default [
  {
    method: 'GET',
    path: routePath,
    ...requestToUseController({
      routeId,
      getViewModel,
      getSessionData: requestToUseSession.get
    })
  },
  {
    method: 'POST',
    path: routePath,
    ...createPostController({
      formValidation,
      getNextPage,
      saveToSession: requestToUseSession.save
    })
  }
]
