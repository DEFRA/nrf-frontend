import routesStart from './start/routes.js'

export const quote = {
  plugin: {
    name: 'quote',
    register(server) {
      server.route([...routesStart])
    }
  }
}
