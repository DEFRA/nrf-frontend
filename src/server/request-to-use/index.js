import routesHaveNrlReference from './have-nrl-reference/routes.js'
import routesNoNrlReference from './no-nrl-reference/routes.js'
import routesEnterNrlReference from './enter-nrl-reference/routes.js'

export const requestToUse = {
  plugin: {
    name: 'request-to-use',
    register(server) {
      server.route([
        ...routesHaveNrlReference,
        ...routesEnterNrlReference,
        ...routesNoNrlReference
      ])
    }
  }
}
