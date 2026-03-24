import { versionController } from './controller.js'

/**
 * @openapi
 * /version:
 *   get:
 *     tags:
 *       - Version
 *     summary: Service version
 *     description: Returns the service version (git hash)
 *     responses:
 *       200:
 *         description: Returns the service version
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 version:
 *                   type: string
 *                   example: abc1234
 */
export const version = {
  plugin: {
    name: 'version',
    register(server) {
      server.route({
        method: 'GET',
        path: '/version',
        ...versionController,
        options: {
          ...versionController.options,
          auth: false
        }
      })
    }
  }
}
