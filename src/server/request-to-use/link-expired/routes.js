import { requestToUseController } from '../controller-get.js'
import getViewModel from './get-view-model.js'
import { linkExpiredPostController } from './controller-post.js'
import { requireExpiredLink } from './require-expired-link.js'
import { routePath } from './route-path.js'

const routeId = 'link-expired'

export { routePath }

/**
 * @openapi
 * /request-to-use/link-expired:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: This link has expired page
 *     description: Renders the page shown when a magic link has been used or has timed out, with a button to request a new link. Only reachable straight after opening such a link; otherwise it shows the page not found page.
 *     responses:
 *       200:
 *         description: HTML dropout page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       404:
 *         description: The user did not arrive from a used or timed out magic link
 *   post:
 *     tags:
 *       - RequestToUse
 *     summary: Request a new magic link
 *     description: Exchanges the spent link's token, kept in the session, for a new link emailed to the quote owner.
 *     responses:
 *       303:
 *         description: Redirect to the email confirmation page
 *       404:
 *         description: The user did not arrive from a used or timed out magic link, or the backend did not accept its token
 */
export default [
  {
    method: 'GET',
    path: routePath,
    options: { pre: [requireExpiredLink] },
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routePath,
    options: { pre: [requireExpiredLink] },
    ...linkExpiredPostController
  }
]
