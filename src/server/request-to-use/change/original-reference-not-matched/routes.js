import { requestToUseController } from '../../controller-get.js'
import getViewModel from './get-view-model.js'
import { routePath } from './route-path.js'

export { routePath }

/**
 * @openapi
 * /request-to-use/change/original-reference-not-matched:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: NRL reference does not match our records page, reached from a change
 *     description: Renders the original reference not matched page when the reference was changed from the check your answers page
 *     responses:
 *       200:
 *         description: HTML page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
export default [
  {
    method: 'GET',
    path: routePath,
    // The routeId is the original reference not matched page's template dir:
    // this route renders that page itself under the change prefix.
    ...requestToUseController({
      routeId: 'original-reference-not-matched',
      getViewModel
    })
  }
]
