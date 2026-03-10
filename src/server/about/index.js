import { aboutController } from './controller.js'

/**
 * @openapi
 * /about:
 *   get:
 *     tags:
 *       - About
 *     summary: About page
 *     description: Renders the about page
 *     responses:
 *       200:
 *         description: HTML about page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
export const about = {
  plugin: {
    name: 'about',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/about',
          ...aboutController,
          options: {
            ...aboutController.options,
            auth: false
          }
        }
      ])
    }
  }
}
