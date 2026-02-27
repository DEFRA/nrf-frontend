import routesStart from './start/routes.js'
import routesBoundaryType from './boundary-type/routes.js'
import routesResidential from './residential/routes.js'
import routesNoEdp from './no-edp/routes.js'
import routesDevelopmentType from './development-types/routes.js'
import routesEmail from './email/routes.js'

// Placeholder route for pages not yet implemented
const placeholderRoute = {
  method: 'GET',
  path: '/quote/next',
  handler: () => '<h1>Placeholder</h1><p>This page is not yet implemented.</p>'
}

export const quote = {
  plugin: {
    name: 'quote',
    register(server) {
      server.route([
        ...routesStart,
        ...routesBoundaryType,
        ...routesResidential,
        ...routesNoEdp,
        ...routesDevelopmentType,
        ...routesEmail,
        placeholderRoute
      ])
    }
  }
}
