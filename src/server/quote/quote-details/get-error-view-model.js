import { getPageTitle } from '../../common/helpers/page-title.js'
import { quoteAccessStatus } from './helpers/quote-access-status.js'

// View-model variants mapping onto the backend access statuses.
export const errorVariant = {
  knownExpired: 'knownExpired',
  unknownExpired: 'unknownExpired',
  noQuote: 'noQuote'
}

const variantByStatus = {
  [quoteAccessStatus.expired]: {
    variant: errorVariant.knownExpired,
    heading: 'This link is no longer active'
  },
  [quoteAccessStatus.invalid]: {
    variant: errorVariant.unknownExpired,
    heading: 'The link is invalid'
  },
  [quoteAccessStatus.notFound]: {
    variant: errorVariant.noQuote,
    heading:
      'The NRF reference you have supplied does not match an existing quote'
  }
}

/**
 * Builds the view model for the quote-details error page, selecting the resend
 * affordance to render from the backend access status.
 *
 * @param {string} status - the backend access status (valid/invalid/expired/not_found)
 * @param {object} [options]
 * @param {string} [options.reference] - the quote reference, used to build form actions
 * @param {string} [options.token] - the raw access token, threaded into the State 2 one-click form
 * @returns {object} the view model
 */
export default function getErrorViewModel(status, { reference, token } = {}) {
  const { variant, heading } =
    variantByStatus[status] ?? variantByStatus[quoteAccessStatus.invalid]

  return {
    pageTitle: getPageTitle(heading),
    pageHeading: heading,
    variant,
    reference,
    token
  }
}
