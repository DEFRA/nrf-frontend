import { quoteController } from '../controller-get.js'
import { quotePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import formValidation from './form-validation.js'
import getNextPage from './get-next-page.js'

const routeId = 'confirm-housing'
export const routePath = '/quote/confirm-housing'

/**
 * @openapi
 * /quote/confirm-housing:
 *   get:
 *     tags:
 *       - Quote
 *     summary: Confirm housing units page
 *     description: Renders the housing units confirmation form
 *     responses:
 *       200:
 *         description: HTML form page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *   post:
 *     tags:
 *       - Quote
 *     summary: Submit housing units confirmation
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - isHousing
 *             properties:
 *               isHousing:
 *                 type: string
 *                 enum:
 *                   - yes
 *                   - no
 *     responses:
 *       303:
 *         description: Redirect to next step on success or back to form on validation failure
 */
export default [
  {
    method: 'GET',
    path: routePath,
    ...quoteController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routePath,
    ...quotePostController({
      routeId,
      formValidation,
      getViewModel,
      getNextPage
    })
  }
]
