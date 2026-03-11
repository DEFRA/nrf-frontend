import { quoteController } from '../controller-get.js'
import { quotePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import formValidation from './form-validation.js'
import getNextPage from './get-next-page.js'

const routeId = 'boundary-type'
export const routePath = '/quote/boundary-type'

/**
 * @openapi
 * /quote/boundary-type:
 *   get:
 *     tags:
 *       - Quote
 *     summary: Boundary type selection page
 *     description: Renders the boundary entry type selection form
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
 *     summary: Submit boundary type selection
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - boundaryEntryType
 *             properties:
 *               boundaryEntryType:
 *                 type: string
 *                 enum:
 *                   - draw
 *                   - upload
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
