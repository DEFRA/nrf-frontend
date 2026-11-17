import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as enterOriginalReferencePath } from '../original-reference/route-path.js'

const fallbackHeading = 'This NRL reference does not match our records'

/**
 * @param {import('../controller-get.js').ViewModelInput} [input]
 * @returns {object} view model for the original reference not matched page
 */
export default function getViewModel({ session } = {}) {
  const reference = session?.requestToUse?.originalNrlReference
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
