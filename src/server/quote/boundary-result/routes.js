import { handler } from './controller.js'

export const routePath = '/quote/boundary-result'

/**
 * @openapi
 * /quote/boundary-result:
 *   get:
 *     tags:
 *       - Quote
 *     summary: Boundary check result page
 *     description: Displays the result of the boundary spatial check
 *     responses:
 *       200:
 *         description: HTML boundary result page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
export default [
  {
    method: 'GET',
    path: routePath,
    handler
  }
]
