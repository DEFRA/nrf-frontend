import routesConfirmHousing from './confirm-housing/routes.js'
import routesApplicationTypeNotAvailable from './application-type-not-available/routes.js'
import routesPlanningType from './planning-type/routes.js'
import routesBoundaryType from './boundary-type/routes.js'
import routesUnitNumber from './unit-number/routes.js'
import routesNotInEdp from './not-in-edp/routes.js'
import routesNotHousing from './not-housing/routes.js'
import routesEmail from './email/routes.js'
import routesUploadBoundary from './upload-boundary/routes.js'
import routesDrawBoundary from './draw-boundary/routes.js'
import routesCheckingFile from './checking-file/routes.js'
import routesFilePreview from './file-preview/routes.js'
import routesCheckYourAnswers from './check-your-answers/routes.js'
import routesConfirmation from './confirmation/routes.js'
import routesDeleteQuote from './delete-quote/routes.js'
import routesDeleteQuoteConfirmation from './delete-quote-confirmation/routes.js'
import routesQuoteDetails from './quote-details/routes.js'
import routesQuoteDetailsResend from './quote-details/routes-resend.js'
import routesExcludedArea from './excluded-area/routes.js'
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
        ...routesConfirmHousing,
        ...routesApplicationTypeNotAvailable,
        ...routesPlanningType,
        ...routesBoundaryType,
        ...routesUnitNumber,
        ...routesNotInEdp,
        ...routesNotHousing,
        ...routesEmail,
        ...routesUploadBoundary,
        ...routesDrawBoundary,
        ...routesCheckingFile,
        ...routesFilePreview,
        ...routesCheckYourAnswers,
        ...routesConfirmation,
        ...routesDeleteQuote,
        ...routesDeleteQuoteConfirmation,
        ...routesQuoteDetails,
        ...routesQuoteDetailsResend,
        ...routesExcludedArea
      ])
    }
  }
}
