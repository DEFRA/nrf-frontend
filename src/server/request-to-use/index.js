import routesHaveNrlReference from './have-nrl-reference/routes.js'
import routesNoNrlReference from './no-nrl-reference/routes.js'
import routesEnterNrlReference from './enter-nrl-reference/routes.js'
import routesEnterEmail from './enter-email/routes.js'
import routesEmailConfirmation from './email-confirmation/routes.js'
import routesQuoteNotMatched from './quote-not-matched/routes.js'

export const requestToUse = {
  plugin: {
    name: 'request-to-use',
    register(server) {
      server.route([
        ...routesHaveNrlReference,
        ...routesEnterNrlReference,
        ...routesNoNrlReference,
        ...routesEnterEmail,
        ...routesEmailConfirmation,
        ...routesQuoteNotMatched
      ])
    }
  }
}
