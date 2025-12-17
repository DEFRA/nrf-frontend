import {
  loginController,
  signInController,
  signInOidcController,
  signOutController,
  signOutOidcController
} from './controller.js'

export const auth = {
  plugin: {
    name: 'auth',
    register(server) {
      // Check if auth was actually successfully registered (not just enabled in config)
      const authEnabled = server.app.authEnabled || false

      // Always register login page
      server.route([
        {
          method: 'GET',
          path: '/login',
          ...loginController
        }
      ])

      // Only register OAuth routes if auth plugin successfully registered
      if (authEnabled) {
        server.route([
          {
            method: 'GET',
            path: '/auth/sign-in',
            ...signInController
          },
          {
            method: 'GET',
            path: '/login/return',
            ...signInOidcController
          },
          {
            method: 'GET',
            path: '/auth/sign-out',
            ...signOutController
          },
          {
            method: 'GET',
            path: '/auth/sign-out-oidc',
            ...signOutOidcController
          }
        ])
      }
    }
  }
}
