import { profileController } from './controller.js'

/**
 * @openapi
 * /profile:
 *   get:
 *     tags:
 *       - Profile
 *     summary: User profile page
 *     description: Displays the authenticated user's profile information
 *     responses:
 *       200:
 *         description: HTML profile page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       302:
 *         description: Redirect to login if not authenticated
 */
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
