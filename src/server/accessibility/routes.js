import { accessibilityController } from './controller.js'
import { routePath } from './route-path.js'

export { routePath }

/**
 * @openapi
 * /accessibility:
 *   get:
 *     tags:
 *       - Accessibility
 *     summary: Accessibility statement page
 *     description: Renders the accessibility statement for the nature restoration levy service
 *     responses:
 *       200:
 *         description: HTML accessibility statement page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
export const accessibilityRoutes = [
  {
    method: 'GET',
    path: routePath,
    ...accessibilityController
  }
]
