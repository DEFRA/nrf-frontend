import routes from './routes.js'

export const osBaseMap = {
  plugin: {
    name: 'os-base-map',
    register(server) {
      server.route(routes)
    }
  }
}
