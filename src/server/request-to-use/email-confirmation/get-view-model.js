import { getPageTitle } from '../../common/helpers/page-title.js'

export const pageHeading = 'We have sent you an email'

/**
 * @param {import('../controller-get.js').ViewModelInput} [input]
 * @returns {object} view model for the we have sent you an email page
 */
export default function getViewModel({ session } = {}) {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    email: session?.retrieveQuote?.email
  }
}
