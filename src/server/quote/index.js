import routesStart from './start/routes.js'
import routesBoundaryType from './boundary-type/routes.js'
import routesResidential from './residential/routes.js'
import routesNoEdp from './no-edp/routes.js'
import routesDevelopmentType from './development-types/routes.js'
import routesEmail from './email/routes.js'
import routesUploadBoundary from './upload-boundary/routes.js'
import routesUploadReceived from './upload-received/routes.js'
import routesCheckBoundaryResult from './check-boundary-result/routes.js'
import routesCheckYourAnswers from './check-your-answers/routes.js'
import routesConfirmation from './confirmation/routes.js'
import routesPeopleCount from './people-count/routes.js'
import routesDeleteQuote from './delete-quote/routes.js'
import { checkForValidQuoteSession } from './helpers/is-quote-session-in-progress/index.js'

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

export const quote = {
  plugin: {
    name: 'quote',
    register(server) {
      server.ext('onPreHandler', checkForValidQuoteSession)

      server.route([
        ...routesStart,
        ...routesBoundaryType,
        ...routesResidential,
        ...routesNoEdp,
        ...routesDevelopmentType,
        ...routesEmail,
        ...routesUploadBoundary,
        ...routesUploadReceived,
        ...routesCheckBoundaryResult,
        ...routesCheckYourAnswers,
        ...routesPeopleCount,
        ...routesConfirmation,
        ...routesDeleteQuote
      ])
    }
  }
}
