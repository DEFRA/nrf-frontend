import routesStartPage from './start-page/routes.js'
import routesWhatWouldYouLikeToDo from './what-would-you-like-to-do/routes.js'
import { checkForAcceptedEmail } from './helpers/check-for-accepted-email/index.js'
import routesRootRedirect from './root-redirect.js'

export const manage = {
  plugin: {
    name: 'manage',
    register(server) {
      server.ext('onPreHandler', checkForAcceptedEmail, { sandbox: 'plugin' })

      server.route([
        ...routesStartPage,
        ...routesWhatWouldYouLikeToDo,
        ...routesRootRedirect
      ])
    }
  }
}
