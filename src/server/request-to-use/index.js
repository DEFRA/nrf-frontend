import routesNrlReference from './nrl-reference/routes.js'
import routesEnterNrlReference from './enter-nrl-reference/routes.js'
import routesCommitmentCertificate from './commitment-certificate/routes.js'
import routesCheckYourAnswers from './check-your-answers/routes.js'
import routesConfirmation from './confirmation/routes.js'
import { registerRequestToUseSessionCookie } from './session-cookie.js'

/**
 * @openapi
 * /quote/next:
 *   get:
 *     tags:
 *       - Quote
 *     summary: Placeholder page
 *     description: Placeholder for pages not yet implemented
 *     responses:
 *       200:
 *         description: HTML placeholder page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */

export const requestToUse = {
  plugin: {
    name: 'requestToUse',
    register(server) {
      registerRequestToUseSessionCookie(server)

      server.route([
        ...routesNrlReference,
        ...routesEnterNrlReference,
        ...routesCommitmentCertificate,
        ...routesCheckYourAnswers,
        ...routesConfirmation
      ])
    }
  }
}
