import Boom from '@hapi/boom'
import { postRequestToBackend } from '../../common/services/nrf-backend.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { saveResendConfirmationToCache } from './helpers/resend-confirmation-session.js'

/**
 * Handles the one-click resend from the "link no longer active" page (State 2).
 * Possession of the (expired) token is treated as proof of ownership, so the
 * token is passed back to the backend and a new link is emailed to the address
 * originally used for the quote.
 *
 * Follows POST-Redirect-GET: the confirmation message is stashed in the session
 * and the user is redirected to the GET confirmation route, so a refresh doesn't
 * re-trigger the resend.
 */
export const quoteDetailsResendKnownController = {
  async handler(request, h) {
    const { reference } = request.params
    const { token } = request.payload

    const { payload } = await postRequestToBackend({
      endpointPath: `/quotes/${reference}/resend-known`,
      payload: { token }
    })

    // The backend omits the message when the email wasn't actually sent (e.g.
    // Notify rejected it); show the error page rather than a blank "link sent".
    if (!payload.message) {
      throw Boom.badGateway('Resend email was not sent')
    }

    saveResendConfirmationToCache(request, { message: payload.message })

    return h
      .redirect(`/quote/${reference}/resend-known`)
      .code(statusCodes.redirectAfterPost)
  }
}
