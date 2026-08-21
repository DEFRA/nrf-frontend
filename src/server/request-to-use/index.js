import routesNrlReference from './nrl-reference/routes.js'
import routesEnterNrlReference from './enter-nrl-reference/routes.js'
import routesCommitmentCertificate from './commitment-certificate/routes.js'
import routesCheckYourAnswers from './check-your-answers/routes.js'
import routesConfirmation from './confirmation/routes.js'
import routesCreatingDefraAccount from './creating-defra-account/routes.js'
import routesQuoteEmail from './quote-email/routes.js'
import routesRetrieveQuoteDetails from './retrieve-quote-details/routes.js'
import routesLevyAmountIncreased from './levy-amount-increased/routes.js'
import routesEnterEmailAddress from './enter-email-address/routes.js'
import routesIsThisAVariation from './is-this-a-variation/routes.js'
import routesDeveloperDetails from './developer-details/routes.js'
import routesSignInHow from './sign-in-how/routes.js'
import routesReviewQuoteDetails from './review-quote-details/routes.js'
import routesOneLoginEmailAddress from './one-login-email-address/routes.js'
import routesOneLoginPassword from './one-login-password/routes.js'
import routesReviewDeveloperDetails from './review-developer-details/routes.js'
import routesCommitmentEmail from './commitment-email/routes.js'
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
        ...routesConfirmation,
        ...routesCreatingDefraAccount,
        ...routesQuoteEmail,
        ...routesRetrieveQuoteDetails,
        ...routesLevyAmountIncreased,
        ...routesEnterEmailAddress,
        ...routesIsThisAVariation,
        ...routesDeveloperDetails,
        ...routesSignInHow,
        ...routesReviewQuoteDetails,
        ...routesOneLoginEmailAddress,
        ...routesOneLoginPassword,
        ...routesReviewDeveloperDetails,
        ...routesCommitmentEmail
      ])
    }
  }
}
