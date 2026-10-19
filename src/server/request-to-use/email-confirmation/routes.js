import { requestToUseController } from '../controller-get.js'
import getViewModel from './get-view-model.js'
import { retrieveQuoteSession } from '../helpers/retrieve-quote-session/index.js'
import { routePath } from './route-path.js'

const routeId = 'email-confirmation'

export { routePath }

/**
 * @openapi
 * /request-to-use/email-confirmation:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: We have sent you an email page
 *     description: Renders the confirmation page shown after an email address is submitted on the enter your email address page
 *     responses:
 *       200:
 *         description: HTML confirmation page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
export default [
  {
    method: 'GET',
    path: routePath,
    ...requestToUseController({
      routeId,
      getViewModel,
      getSessionData: retrieveQuoteSession.get
    })
  }
]
