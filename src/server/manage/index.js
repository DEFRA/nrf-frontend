import routesStartPage from './start-page/routes.js'
import routesWhatWouldYouLikeToDo from './what-would-you-like-to-do/routes.js'
import routesRootRedirect from './root-redirect.js'

export const manage = {
  plugin: {
    name: 'manage',
    register(server) {
      server.route([
        ...routesStartPage,
        ...routesWhatWouldYouLikeToDo,
        ...routesRootRedirect
      ])
    }
  }
}
