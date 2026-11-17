import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as originalReferencePath } from '../original-reference/route-path.js'
import { routePath as reviewQuoteDetailsPath } from '../review-quote-details/route-path.js'

const pageHeading = 'Details do not match'

/**
 * @param {import('../controller-get.js').ViewModelInput} [input]
 * @returns {object} view model for the original boundary not matched page
 */
export default function getViewModel({ session } = {}) {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    originalNrlReference:
      session.requestToUse.originalNrlReference.toUpperCase(),
    backLinkPath: originalReferencePath,
    originalReferencePath,
    reviewQuoteDetailsPath
  }
}
