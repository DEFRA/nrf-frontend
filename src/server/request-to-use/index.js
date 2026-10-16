import routesHaveNrlReference from './have-nrl-reference/routes.js'
import routesNoNrlReference from './no-nrl-reference/routes.js'
import routesEnterNrlReference from './enter-nrl-reference/routes.js'
import routesEnterEmail from './enter-email/routes.js'
import routesEmailConfirmation from './email-confirmation/routes.js'
import routesQuoteNotMatched from './quote-not-matched/routes.js'
import routesReviewQuoteDetails from './review-quote-details/routes.js'
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
        ...routesQuoteNotMatched,
        ...routesReviewQuoteDetails
      ])
    }
  }
}
