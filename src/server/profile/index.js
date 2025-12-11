import { profileController } from './controller.js'

export const profile = {
  plugin: {
    name: 'profile',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/profile',
          ...profileController
        }
      ])
    }
  }
}
