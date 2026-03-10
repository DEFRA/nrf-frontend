import { handler } from './controller.js'

export const routePath = '/quote/upload-boundary'

/**
 * @openapi
 * /quote/upload-boundary:
 *   get:
 *     tags:
 *       - Quote
 *     summary: Upload boundary page
 *     description: Initiates a CDP upload session and renders the upload page
 *     responses:
 *       200:
 *         description: HTML upload page with upload URL
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
