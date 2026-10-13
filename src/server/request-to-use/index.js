import routesHaveNrlReference from './have-nrl-reference/routes.js'

export const requestToUse = {
  plugin: {
    name: 'request-to-use',
    register(server) {
      server.route([...routesHaveNrlReference])
    }
  }
}
