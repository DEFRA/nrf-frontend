import { accessibilityRoutes } from './routes.js'

export const accessibility = {
  plugin: {
    name: 'accessibility',
    register(server) {
      server.route(accessibilityRoutes)
    }
  }
}
