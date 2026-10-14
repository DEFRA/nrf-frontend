import routesHaveNrlReference from './have-nrl-reference/routes.js'
import routesNoNrlReference from './no-nrl-reference/routes.js'
import routesEnterNrlReference from './enter-nrl-reference/routes.js'
import routesEnterEmail from './enter-email/routes.js'
import { checkForValidRetrieveQuoteSession } from './helpers/is-retrieve-quote-session-in-progress/index.js'

export const requestToUse = {
  plugin: {
    name: 'request-to-use',
    register(server) {
      server.ext('onPreHandler', checkForValidRetrieveQuoteSession)

      server.route([
        ...routesHaveNrlReference,
        ...routesEnterNrlReference,
        ...routesNoNrlReference,
        ...routesEnterEmail
      ])
    }
  }
}
