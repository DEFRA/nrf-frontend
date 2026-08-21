import { requestToUseController } from '../controller-get.js'
import getViewModel from './get-view-model.js'

const routeId = 'retrieve-quote-details'
export const routeRetrieveQuoteDetails =
  '/request-to-use/retrieve-quote-details'

/**
 * @openapi
 * /request-to-use/retrieve-quote-details:
 *   get:
 *     tags:
 *       - Request to use
 *     summary: Retrieve quote details page
 *     description: Renders the page explaining how to retrieve quote details for the nature restoration levy
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
    path: routeRetrieveQuoteDetails,
    ...requestToUseController({ routeId, getViewModel })
  }
]
