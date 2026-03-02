import routes from './routes.js'

export const uploadReceived = {
  plugin: {
    name: 'upload-received',
    register(server) {
      server.route(routes)
    }
  }
}
