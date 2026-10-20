import Boom from '@hapi/boom'
import { requestNewEmailQuoteLinkFromBackend } from '../../common/services/nrf-backend.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { expiredLinkSession } from '../helpers/expired-link-session/index.js'
import { retrieveQuoteSession } from '../helpers/retrieve-quote-session/index.js'
import { routePath as emailConfirmationPath } from '../email-confirmation/route-path.js'
import {
  journeys,
  selectJourney
} from '../../common/helpers/journey-session/index.js'

export const linkExpiredPostController = {
  async handler(request, h) {
    const { reference, token } = expiredLinkSession.get(request)

    const { matched, email } = await requestNewEmailQuoteLinkFromBackend({
      reference,
      token
    })
    if (!matched) {
      return Boom.notFound()
    }

    expiredLinkSession.clear(request)
    // The user arrived from a magic link, not the what would you like to do
    // page, and the email confirmation page is only reachable in this journey.
    selectJourney({ request, journey: journeys.requestToUse })
    // Saved so the email confirmation page can show where the link was sent.
    retrieveQuoteSession.save(request, { email })

    return h.redirect(emailConfirmationPath).code(statusCodes.redirectAfterPost)
  }
}
