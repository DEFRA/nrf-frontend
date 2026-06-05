import { postRequestToBackend } from '../../common/services/nrf-backend.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { saveResendConfirmationToCache } from './helpers/resend-confirmation-session.js'

// Fixed generic copy shown for every request — successful or not — so a user
// cannot tell from the page whether a matching quote or email exists.
const genericMessage = "If a matching quote is found, we've sent a new link."

/**
 * Handles the resend from the "link has expired" page (State 3). The user
 * supplies the email used for the quote; the backend only sends a link when it
 * matches, but the page always shows the same generic confirmation.
 *
 * Follows POST-Redirect-GET: the generic message is stashed in the session and
 * the user is redirected to the GET confirmation route, so a refresh doesn't
 * re-trigger the resend.
 */
export const quoteDetailsResendUnknownController = {
  async handler(request, h) {
    const { reference } = request.params
    const { email } = request.payload

    await postRequestToBackend({
      endpointPath: `/quotes/${reference}/resend-unknown`,
      payload: { email }
    })

    saveResendConfirmationToCache(request, { message: genericMessage })

    return h
      .redirect(`/quote/${reference}/resend-unknown`)
      .code(statusCodes.redirectAfterPost)
  }
}
