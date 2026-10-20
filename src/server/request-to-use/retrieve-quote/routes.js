import joi from 'joi'
import { referenceParam, tokenParam } from '@defra/nrf-library'
import { retrieveQuoteEmailLinkGetController } from './controller-get.js'
import { routePath } from './route-path.js'
import { respondNotFound } from '../../common/helpers/respond-not-found.js'

export { routePath }

/**
 * @openapi
 * /request-to-use/retrieve/{reference}/{token}:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Magic link from the retrieve your quote email
 *     description: >
 *       Spends the single-use token, starts a request to use session from the
 *       saved quote and redirects to the review and amend your quote details
 *       page. A used or timed out link redirects to the link expired page, where
 *       the user can ask for a new one. A link that is malformed, for an unknown
 *       quote or has a wrong token shows the page not found page, the same for
 *       all three so a visitor cannot tell whether a quote exists. The token and NRL reference are in the URL path because the link has to
 *       be a clickable GET URL in an email. The token is a path segment rather
 *       than a query string so it is not passed on in Referer headers, it is
 *       never repeated in a redirect, and link previewers and scanners get an
 *       empty response without spending it. The token is single-use and expires
 *       after 24 hours, so a copy found in a log or browser history is of no
 *       use. The backend call keeps it in the request body, not the URL.
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
 *       302:
 *         description: Redirect to the review and amend page, or the link expired page
 *       404:
 *         description: The link is malformed, for an unknown quote or has a wrong token
 */
export default [
  {
    method: 'GET',
    path: routePath,
    options: {
      validate: {
        params: joi.object({ reference: referenceParam, token: tokenParam }),
        failAction: respondNotFound
      }
    },
    ...retrieveQuoteEmailLinkGetController
  }
]
