import routesStart from './start/routes.js'
import routesBoundaryType from './boundary-type/routes.js'

export const quote = {
  plugin: {
    name: 'quote',
    register(server) {
      server.route([...routesStart, ...routesBoundaryType])
    }
  }
}
