import routes from './routes.js'

export const osNamesSearch = {
  plugin: {
    name: 'os-names-search',
    register(server) {
      server.route(routes)
    }
  }
}
