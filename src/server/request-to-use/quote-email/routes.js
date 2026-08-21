import { requestToUseController } from '../controller-get.js'
import getViewModel from './get-view-model.js'

const routeId = 'quote-email'
export const routeQuoteEmail = '/request-to-use/quote-email'

/**
 * @openapi
 * /request-to-use/quote-email:
 *   get:
 *     tags:
 *       - Request to use
 *     summary: Quote email content page
 *     description: Renders the nature restoration levy quote email content
 *     responses:
 *       200:
 *         description: HTML information page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
export default [
  {
    method: 'GET',
    path: routeQuoteEmail,
    ...requestToUseController({ routeId, getViewModel })
  }
]
