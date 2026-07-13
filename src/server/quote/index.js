import routesStart from './start/routes.js'
import routesConfirmHousing from './confirm-housing/routes.js'
import routesApplicationTypeNotAvailable from './application-type-not-available/routes.js'
import routesPlanningType from './planning-type/routes.js'
import routesBoundaryType from './boundary-type/routes.js'
import routesUnits from './units/routes.js'
import routesNoEdp from './no-edp/routes.js'
import routesNotHousing from './not-housing/routes.js'
import routesEmail from './email/routes.js'
import routesUploadBoundary from './upload-boundary/routes.js'
import routesDrawBoundary from './draw-boundary/routes.js'
import routesUploadReceived from './upload-received/routes.js'
import routesUploadPreviewMap from './upload-preview-map/routes.js'
import routesCheckYourAnswers from './check-your-answers/routes.js'
import routesConfirmation from './confirmation/routes.js'
import routesDeleteQuote from './delete-quote/routes.js'
import routesDeleteQuoteConfirmation from './delete-quote-confirmation/routes.js'
import routesQuoteDetails from './quote-details/routes.js'
import routesQuoteDetailsResend from './quote-details/routes-resend.js'
import { checkForValidQuoteSession } from './helpers/is-quote-session-in-progress/index.js'
import { registerQuoteDetailsSessionCookie } from './quote-details/helpers/quote-details-session-cookie.js'

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
      registerQuoteDetailsSessionCookie(server)

      server.ext('onPreHandler', checkForValidQuoteSession)

      server.route([
        ...routesStart,
        ...routesConfirmHousing,
        ...routesApplicationTypeNotAvailable,
        ...routesPlanningType,
        ...routesBoundaryType,
        ...routesUnits,
        ...routesNoEdp,
        ...routesNotHousing,
        ...routesEmail,
        ...routesUploadBoundary,
        ...routesDrawBoundary,
        ...routesUploadReceived,
        ...routesUploadPreviewMap,
        ...routesCheckYourAnswers,
        ...routesConfirmation,
        ...routesDeleteQuote,
        ...routesDeleteQuoteConfirmation,
        ...routesQuoteDetails,
        ...routesQuoteDetailsResend
      ])
    }
  }
}
