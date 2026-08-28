import { requestToUseController } from '../controller-get.js'
import getViewModel from './get-view-model.js'

const routeId = 'commitment-email'
export const routeCommitmentEmail = '/request-to-use/commitment-email'

/**
 * @openapi
 * /request-to-use/commitment-email:
 *   get:
 *     tags:
 *       - Request to use
 *     summary: Commitment email content page
 *     description: Renders the email content sent after requesting to use the nature restoration levy
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
    path: routeCommitmentEmail,
    ...requestToUseController({ routeId, getViewModel })
  }
]
