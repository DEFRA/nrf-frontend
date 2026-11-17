import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as enterNrlReferencePath } from '../enter-nrl-reference/route-path.js'

export const pageHeading = 'Enter your email address'

/**
 * @param {import('../controller-get.js').ViewModelInput} [input]
 * @returns {object} template data
 */
export default function getViewModel({ session } = {}) {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: enterNrlReferencePath,
    formData: { email: session?.retrieveQuote?.email }
  }
}
