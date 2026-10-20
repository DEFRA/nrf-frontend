import Boom from '@hapi/boom'
import { QUOTE_ACCESS_STATUS } from '@defra/nrf-library'
import {
  getQuoteFromBackend,
  redeemEmailQuoteLinkToken
} from '../../common/services/nrf-backend.js'
import { isPrefetchRequest } from '../../common/helpers/is-prefetch-request/index.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { seedSessionFromQuote } from '../helpers/seed-session-from-quote/index.js'
import { expiredLinkSession } from '../helpers/expired-link-session/index.js'
import { routePath as reviewQuoteDetailsPath } from '../review-quote-details/route-path.js'
import { routePath as linkExpiredPath } from '../link-expired/route-path.js'

// Handles the magic link in the retrieve your quote email (see the backend
// email-quote-link endpoint that sends it).
export const retrieveQuoteEmailLinkGetController = {
  async handler(request, h) {
    // A previewer or scanner must not spend the single-use link.
    if (isPrefetchRequest(request)) {
      return h.response().code(statusCodes.ok)
    }

    const { reference, token } = request.params

    const accessStatus = await redeemEmailQuoteLinkToken({ reference, token })

    if (accessStatus === QUOTE_ACCESS_STATUS.expired) {
      // The expired link is the proof that lets the user ask for a new one.
      expiredLinkSession.save(request, { reference, token })
      return h.redirect(linkExpiredPath).code(statusCodes.found)
    }

    // An unknown reference and a wrong token get the same page, so a visitor
    // cannot tell whether a quote exists.
    if (accessStatus !== QUOTE_ACCESS_STATUS.valid) {
      return Boom.notFound()
    }

    const { payload: quote } = await getQuoteFromBackend({ reference })
    seedSessionFromQuote({ request, quote })

    return h.redirect(reviewQuoteDetailsPath).code(statusCodes.found)
  }
}
