import { postRequestToBackend } from '../../common/services/nrf-backend.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { saveResendConfirmationToCache } from './helpers/resend-confirmation-session.js'
import getErrorViewModel from './get-error-view-model.js'
import { quoteAccessStatus } from './helpers/quote-access-status.js'

/**
 * Handles the one-click resend from the "link no longer active" page (State 2).
 * Possession of the (expired) token is treated as proof of ownership, so the
 * token is passed back to the backend and a new link is emailed to the address
 * originally used for the quote.
 *
 * Follows POST-Redirect-GET: the confirmation message is stashed in the session
 * and the user is redirected to the GET confirmation route, so a refresh doesn't
 * re-trigger the resend.
 *
 * The backend returns a generic 200 with no message when it won't honour the
 * token (e.g. session-exhausted, replaced, or never issued). Rather than claim
 * a link was sent, we fall back to the "link has expired" page so the user can
 * request one via their email. A genuine send failure is a backend 5xx, which
 * propagates to the standard error page.
 */
export const quoteDetailsResendKnownController = {
  async handler(request, h) {
    const { reference } = request.params
    const { token } = request.payload

    const { payload } = await postRequestToBackend({
      endpointPath: `/quotes/${reference}/resend-known`,
      payload: { token }
    })

    if (!payload.message) {
      return h.view(
        'quote/quote-details/error',
        getErrorViewModel(quoteAccessStatus.invalid, { reference })
      )
    }

    saveResendConfirmationToCache(request, { message: payload.message })

    return h
      .redirect(`/quote/${reference}/resend-known`)
      .code(statusCodes.redirectAfterPost)
  }
}
