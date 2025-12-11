import { loginController } from './controller.js'

/**
 * Auth routes plugin
 * Note: /login/out, /login/return, and /logout are provided by defra-identity-plugin
 * This provides the login landing page only
 */
export const auth = {
  plugin: {
    name: 'auth',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/login',
          ...loginController
        }
      ])
    }
  }
}
