import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as originalCommittedPath } from '../original-committed/route-path.js'

export const pageHeading =
  'Enter the NRL reference for the original planning permission'

/**
 * @param {import('../controller-get.js').ViewModelInput} [input]
 * @returns {object} view model for the enter the original reference page
 */
export default function getViewModel({ session } = {}) {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: originalCommittedPath,
    formData: {
      originalReference: session?.requestToUse?.originalNrlReference
    }
  }
}
