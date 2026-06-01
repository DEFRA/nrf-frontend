import { getPageTitle } from '../../common/helpers/page-title.js'
import { quoteAccessStatus } from './quote-access-status.js'

const messages = {
  [quoteAccessStatus.invalid]: 'The link is invalid',
  [quoteAccessStatus.notFound]:
    'The NRF reference you have supplied does not match an existing quote',
  [quoteAccessStatus.expired]: 'This link has expired'
}

export default function getErrorViewModel(status) {
  const message = messages[status] ?? messages[quoteAccessStatus.invalid]

  return {
    pageTitle: getPageTitle(message),
    pageHeading: message
  }
}
