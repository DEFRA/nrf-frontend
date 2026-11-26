import { requestToUseController } from '../../controller-get.js'
import { createRedirectWithoutOriginalReference } from '../../original-boundary-not-matched/redirect-without-original-reference.js'
import { routePath as changeOriginalReferenceNotMatchedPath } from '../original-reference-not-matched/route-path.js'
import getViewModel from './get-view-model.js'
import { routePath } from './route-path.js'

export { routePath }

/**
 * @openapi
 * /request-to-use/change/original-boundary-not-matched:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Details do not match page, reached from a change
 *     description: Renders the original boundary not matched page when the reference was changed from the check your answers page. Redirects to the change reference not matched page when no original reference is saved.
 *     responses:
 *       200:
 *         description: HTML page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       302:
 *         description: Redirect to the change reference not matched page when no original reference is saved
 */
export default [
  {
    method: 'GET',
    path: routePath,
    options: {
      pre: [
        {
          method: createRedirectWithoutOriginalReference(
            changeOriginalReferenceNotMatchedPath
          )
        }
      ]
    },
    // The routeId is the original boundary not matched page's template dir:
    // this route renders that page itself under the change prefix.
    ...requestToUseController({
      routeId: 'original-boundary-not-matched',
      getViewModel
    })
  }
]
