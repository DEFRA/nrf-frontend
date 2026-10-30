import routesHaveNrlReference from './have-nrl-reference/routes.js'
import routesNoNrlReference from './no-nrl-reference/routes.js'
import routesEnterNrlReference from './enter-nrl-reference/routes.js'
import routesEnterEmail from './enter-email/routes.js'
import routesEmailConfirmation from './email-confirmation/routes.js'
import routesEnterAddress from './enter-address/routes.js'
import routesQuoteNotMatched from './quote-not-matched/routes.js'
import routesReviewQuoteDetails from './review-quote-details/routes.js'
import routesAcceptLevy from './accept-levy/routes.js'
import routesDeleteQuote from './delete-quote/routes.js'
import routesDefraAccountUserType from './defra-account-user-type/routes.js'
import routesDefraAccountIndividual from './defra-account-individual/routes.js'
import routesDefraAccountOrganisation from './defra-account-organisation/routes.js'
import routesDefraAccountAgent from './defra-account-agent/routes.js'
import routesChangePlanningType from './change/planning-type/routes.js'
import routesChangeConfirmHousing from './change/confirm-housing/routes.js'
import routesChangeUnitNumber from './change/unit-number/routes.js'
import routesChangeApplicationTypeNotAvailable from './change/application-type-not-available/routes.js'
import routesChangeNotHousing from './change/not-housing/routes.js'
import routesChangeBoundaryType from './change/boundary-type/routes.js'
import routesChangeDrawBoundary from './change/draw-boundary/routes.js'
import routesChangeUploadBoundary from './change/upload-boundary/routes.js'
import routesChangeCheckingFile from './change/checking-file/routes.js'
import routesChangeFilePreview from './change/file-preview/routes.js'
import routesChangeNotInEdp from './change/not-in-edp/routes.js'
import routesChangeExcludedArea from './change/excluded-area/routes.js'
import routesRetrieveQuote from './retrieve-quote/routes.js'
import routesLinkExpired from './link-expired/routes.js'
import { checkForValidRetrieveQuoteSession } from './helpers/is-retrieve-quote-session-in-progress/index.js'
import { checkForValidReviewQuoteSession } from './helpers/is-review-quote-session-in-progress/index.js'

export const requestToUse = {
  plugin: {
    name: 'request-to-use',
    register(server) {
      server.ext('onPreHandler', checkForValidRetrieveQuoteSession, {
        sandbox: 'plugin'
      })
      server.ext('onPreHandler', checkForValidReviewQuoteSession, {
        sandbox: 'plugin'
      })

      server.route([
        ...routesHaveNrlReference,
        ...routesEnterNrlReference,
        ...routesNoNrlReference,
        ...routesEnterEmail,
        ...routesEmailConfirmation,
        ...routesEnterAddress,
        ...routesQuoteNotMatched,
        ...routesReviewQuoteDetails,
        ...routesAcceptLevy,
        ...routesDeleteQuote,
        ...routesDefraAccountUserType,
        ...routesDefraAccountIndividual,
        ...routesDefraAccountOrganisation,
        ...routesDefraAccountAgent,
        ...routesChangePlanningType,
        ...routesChangeConfirmHousing,
        ...routesChangeUnitNumber,
        ...routesChangeApplicationTypeNotAvailable,
        ...routesChangeNotHousing,
        ...routesChangeBoundaryType,
        ...routesChangeDrawBoundary,
        ...routesChangeUploadBoundary,
        ...routesChangeCheckingFile,
        ...routesChangeFilePreview,
        ...routesChangeNotInEdp,
        ...routesChangeExcludedArea,
        ...routesRetrieveQuote,
        ...routesLinkExpired
      ])
    }
  }
}
