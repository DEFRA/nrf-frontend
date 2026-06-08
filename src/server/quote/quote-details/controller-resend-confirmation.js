import { getPageTitle } from '../../common/helpers/page-title.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { takeResendConfirmationFromCache } from './helpers/resend-confirmation-session.js'

const routeId = 'quote-details'

/**
 * Renders the resend confirmation page after a PRG redirect. The confirmation
 * message is read once from the session; on a refresh or direct visit (no
 * message) the user is sent back to the start of the service rather than shown
 * a blank confirmation.
 *
 * @param {object} params
 * @param {string} params.heading - the page heading for this confirmation variant
 */
export const resendConfirmationController = ({ heading }) => ({
  handler(request, h) {
    const confirmation = takeResendConfirmationFromCache(request)

    if (!confirmation) {
      return h.redirect('/').code(statusCodes.redirectAfterPost)
    }

    return h.view(`quote/${routeId}/resend-confirmation`, {
      pageTitle: getPageTitle(heading),
      pageHeading: heading,
      message: confirmation.message
    })
  }
})
