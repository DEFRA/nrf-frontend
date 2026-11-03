import { getPageTitle } from '../../common/helpers/page-title.js'

// Literal route: the enter the original NRL reference page is not built yet.
// Swap for its route-path.js import when it is.
const enterOriginalReferencePath = '/request-to-use/original-reference'

const fallbackHeading = 'This NRL reference does not match our records'

/**
 * @param {{ originalNrlReference?: string } | null} [data] - the request to use session data
 * @param {object} [_query] - unused: the parsed request query
 * @returns {object} view model for the original reference not matched page
 */
export default function getViewModel(data, _query = {}) {
  const reference = data?.originalNrlReference
  const pageHeading = reference
    ? `${reference.toUpperCase()} does not match our records`
    : fallbackHeading

  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: enterOriginalReferencePath,
    enterOriginalReferencePath
  }
}
