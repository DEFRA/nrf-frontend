import routes from './routes.js'

// Serves Ordnance Survey base map resources (vector tiles, sprites, and style metadata)
export const osBaseMap = {
  plugin: {
    name: 'os-base-map',
    register(server) {
      server.route(routes)
    }
  }
}
