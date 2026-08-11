import routesStartPage from './start-page/routes.js'
import routesRootRedirect from './root-redirect.js'

export const manage = {
  plugin: {
    name: 'manage',
    register(server) {
      server.route([...routesStartPage, ...routesRootRedirect])
    }
  }
}
