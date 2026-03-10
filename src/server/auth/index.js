import {
  loginController,
  signInController,
  signInOidcController,
  signOutController,
  signOutOidcController
} from './controller.js'

/**
 * @openapi
 * /login:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Login page
 *     description: Renders the login page
 *     responses:
 *       200:
 *         description: HTML login page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 * /auth/sign-in:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Initiate sign-in
 *     description: Redirects to DEFRA Identity OAuth authorization endpoint
 *     responses:
 *       303:
 *         description: Redirect to OAuth provider
 * /login/return:
 *   get:
 *     tags:
 *       - Auth
 *     summary: OAuth callback
 *     description: Handles the return from DEFRA Identity OAuth authorization
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: CSRF state parameter
 *       - in: query
 *         name: error
 *         schema:
 *           type: string
 *         description: Error code from OAuth provider
 *       - in: query
 *         name: error_description
 *         schema:
 *           type: string
 *         description: Error description from OAuth provider
 *     responses:
 *       200:
 *         description: Error page if authorization failed
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       303:
 *         description: Redirect to home or original URL on success
 * /auth/sign-out:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Sign out
 *     description: Clears session and redirects to home page
 *     responses:
 *       303:
 *         description: Redirect to home page
 * /auth/sign-out-oidc:
 *   get:
 *     tags:
 *       - Auth
 *     summary: OIDC sign-out callback
 *     description: Handles the return from DEFRA Identity logout
 *     parameters:
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Base64-encoded state parameter
 *     responses:
 *       303:
 *         description: Redirect to home page
 */
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
