import routes from './routes.js'

export const baseMap = {
  plugin: {
    name: 'base-map',
    register(server) {
      server.route(routes)
    }
  }
}
