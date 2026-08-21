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
import routesDefraIdRegister from './defra-id-register/routes.js'
import routesDefraIdTerms from './defra-id-terms/routes.js'
import routesDefraIdWhatWeNeed from './defra-id-what-we-need/routes.js'
import routesDefraIdAccountType from './defra-id-account-type/routes.js'
import routesDefraIdIndividualName from './defra-id-individual-name/routes.js'
import routesDefraIdIndividualPhone from './defra-id-individual-phone/routes.js'
import routesDefraIdWhatAddress from './defra-id-what-address/routes.js'
import routesDefraIdSelectAddress from './defra-id-select-address/routes.js'
import routesDefraIdMemorableWord from './defra-id-memorable-word/routes.js'
import routesDefraIdCheckDetailsIndividual from './defra-id-check-details-individual/routes.js'
import routesDefraIdBusinessRegistered from './defra-id-business-registered/routes.js'
import routesDefraIdBusinessCompanyNumber from './defra-id-business-company-number/routes.js'
import routesDefraIdEnterCompanyNumber from './defra-id-enter-company-number/routes.js'
import routesDefraIdBusinessConfirmName from './defra-id-business-confirm-name/routes.js'
import routesDefraIdBusinessEnterContacts from './defra-id-business-enter-contacts/routes.js'
import routesDefraIdBusinessYourName from './defra-id-business-your-name/routes.js'
import routesDefraIdBusinessYourPhone from './defra-id-business-your-phone/routes.js'
import routesDefraIdBusinessMemorableWord from './defra-id-business-memorable-word/routes.js'
import routesDefraIdBusinessCheckDetails from './defra-id-business-check-details/routes.js'
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
        ...routesSignInHow,
        ...routesDefraIdRegister,
        ...routesDefraIdTerms,
        ...routesDefraIdWhatWeNeed,
        ...routesDefraIdAccountType,
        ...routesDefraIdIndividualName,
        ...routesDefraIdIndividualPhone,
        ...routesDefraIdWhatAddress,
        ...routesDefraIdSelectAddress,
        ...routesDefraIdMemorableWord,
        ...routesDefraIdCheckDetailsIndividual,
        ...routesDefraIdBusinessRegistered,
        ...routesDefraIdBusinessCompanyNumber,
        ...routesDefraIdEnterCompanyNumber,
        ...routesDefraIdBusinessConfirmName,
        ...routesDefraIdBusinessEnterContacts,
        ...routesDefraIdBusinessYourName,
        ...routesDefraIdBusinessYourPhone,
        ...routesDefraIdBusinessMemorableWord,
        ...routesDefraIdBusinessCheckDetails
      ])
    }
  }
}
