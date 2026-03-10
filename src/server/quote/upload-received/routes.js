import { handler, checkBoundaryHandler } from './controller.js'

export const routePath = '/quote/upload-received'
export const checkBoundaryPath = '/quote/check-boundary/{id}'

/**
 * @openapi
 * /quote/upload-received:
 *   get:
 *     tags:
 *       - Quote
 *     summary: Upload received page
 *     description: Polls upload status and renders the upload received page
 *     responses:
 *       200:
 *         description: HTML upload status page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 * /quote/check-boundary/{id}:
 *   post:
 *     tags:
 *       - Quote
 *     summary: Check boundary
 *     description: Checks a boundary by ID (not yet implemented)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Boundary ID to check
 *     responses:
 *       200:
 *         description: Boundary check result
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
export default [
  {
    method: 'GET',
    path: routePath,
    handler
  },
  {
    method: 'POST',
    path: checkBoundaryPath,
    handler: checkBoundaryHandler
  }
]
