import { profileController } from './controller.js'
import { config } from '../../config/config.js'

export const profile = {
  plugin: {
    name: 'profile',
    register(server) {
      // Only use 'idm' auth strategy if the identity plugin is enabled
      const authStrategy = config.get('identityProvider.enabled')
        ? 'idm'
        : false

      server.route([
        {
          method: 'GET',
          path: '/profile',
          ...profileController,
          options: { auth: authStrategy }
        }
      ])
    }
  }
}
