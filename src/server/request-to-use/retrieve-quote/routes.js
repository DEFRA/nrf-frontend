import joi from 'joi'
import { referenceParam, tokenParam } from '@defra/nrf-library'
import { retrieveQuoteEmailLinkGetController } from './controller-get.js'
import { routePath } from './route-path.js'
import { routePath as linkExpiredPath } from '../link-expired/route-path.js'
import { statusCodes } from '../../common/constants/status-codes.js'

export { routePath }

/**
 * @openapi
 * /request-to-use/retrieve/{reference}/{token}:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Magic link from the retrieve your quote email
 *     description: Spends the single-use token, starts a request to use session from the saved quote and redirects to the review and amend your quote details page. An invalid or expired link redirects to the link expired page. Link previewers and scanners get an empty response and do not spend the token.
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^NRL-\d{6}$
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       303:
 *         description: Redirect to the review and amend page, or the link expired page
 */
export default [
  {
    method: 'GET',
    path: routePath,
    options: {
      validate: {
        params: joi.object({ reference: referenceParam, token: tokenParam }),
        failAction: (_request, h) =>
          h.redirect(linkExpiredPath).code(statusCodes.found).takeover()
      }
    },
    ...retrieveQuoteEmailLinkGetController
  }
]
