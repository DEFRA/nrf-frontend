import { requestToUseController } from '../controller-get.js'
import { redirectWhenSignedIn } from '../helpers/redirect-when-signed-in/index.js'
import getViewModel from './get-view-model.js'
import { routeId, routePath } from './route-path.js'

export { routePath }

/**
 * @openapi
 * /request-to-use/defra-account-individual:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: You'll need to create or sign in to a Defra account as an individual page
 *     description: Renders the page explaining how to create or sign in to a Defra account as an individual. Redirects to enter address when the user is already signed in.
 *     responses:
 *       200:
 *         description: HTML page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       302:
 *         description: Redirect to enter address when signed in
 */
export default [
  {
    method: 'GET',
    path: routePath,
    options: { pre: [{ method: redirectWhenSignedIn }] },
    ...requestToUseController({ routeId, getViewModel })
  }
]
