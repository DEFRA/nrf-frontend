import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as originalReferencePath } from '../original-reference/route-path.js'
import { routePath as reviewQuoteDetailsPath } from '../review-quote-details/route-path.js'

const pageHeading = 'Details do not match'

/**
 * @param {{ originalNrlReference: string }} data - the request to use session data, which the route guarantees holds the original reference
 * @param {object} [_query] - unused: the parsed request query
 * @returns {object} view model for the original boundary not matched page
 */
export default function getViewModel(data, _query = {}) {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    originalNrlReference: data.originalNrlReference.toUpperCase(),
    backLinkPath: originalReferencePath,
    originalReferencePath,
    reviewQuoteDetailsPath
  }
}
