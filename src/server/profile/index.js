import { profileController } from './controller.js'

export const profile = {
  plugin: {
    name: 'profile',
    register(server) {
      // Use server.app.authEnabled to check if auth actually initialized successfully
      const authStrategy = server.app.authEnabled ? 'defra-session' : false

      server.route([
        {
          method: 'GET',
          path: '/profile',
          ...profileController,
          options: {
            ...profileController.options,
            auth: authStrategy
          }
        }
      ])
    }
  }
}
