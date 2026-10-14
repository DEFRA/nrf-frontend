import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as enterNrlReferencePath } from '../enter-nrl-reference/route-path.js'

export const pageHeading = 'Enter your email address'

/**
 * @returns {object} template data
 */
export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: enterNrlReferencePath
  }
}
