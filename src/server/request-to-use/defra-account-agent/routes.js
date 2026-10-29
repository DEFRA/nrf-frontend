import { requestToUseController } from '../controller-get.js'
import { redirectWhenSignedIn } from '../helpers/redirect-when-signed-in/index.js'
import getViewModel from './get-view-model.js'
import { routeId, routePath } from './route-path.js'

export { routePath }

/**
 * @openapi
 * /request-to-use/defra-account-agent:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Your client will need to create a Defra account and invite you as an agent or third party page
 *     description: Renders the page explaining that the client must create a Defra account and invite the agent or third party. Redirects to enter address when the user is already signed in.
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
