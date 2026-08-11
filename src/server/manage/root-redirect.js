import { routePath as startPagePath } from './start-page/routes.js'
import { statusCodes } from '../common/constants/status-codes.js'

/**
 * @openapi
 * /:
 *   get:
 *     tags:
 *       - Manage
 *     summary: Root redirect
 *     description: Redirects the site root to the start page
 *     responses:
 *       302:
 *         description: Redirect to the start page
 */
export default [
  {
    method: 'GET',
    path: '/',
    handler(_request, h) {
      return h.redirect(startPagePath).code(statusCodes.found)
    }
  }
]
