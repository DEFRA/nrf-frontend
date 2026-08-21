import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'is-this-a-variation'
export const routeIsThisAVariation = '/request-to-use/is-this-a-variation'

/**
 * @openapi
 * /request-to-use/is-this-a-variation:
 *   get:
 *     tags:
 *       - Request to use
 *     summary: Variation question page
 *     description: Renders the page asking whether the development is a variation to a planning application committed to using the levy
 *     responses:
 *       200:
 *         description: HTML form page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
export default [
  {
    method: 'GET',
    path: routeIsThisAVariation,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeIsThisAVariation,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
