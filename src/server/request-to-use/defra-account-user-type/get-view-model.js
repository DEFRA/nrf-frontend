import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as variationPath } from '../variation/route-path.js'
import { routePath as originalCommittedPath } from '../original-committed/route-path.js'
import { routePath as originalReferencePath } from '../original-reference/route-path.js'
import { defraAccountUserTypeOptions } from './options.js'

export const pageHeading =
  'Who are you requesting to use the nature restoration levy for?'

/**
 * The previous page is the last question answered on the way here.
 * Checking variation first ignores a stale originalCommitted answer.
 * @param {{ variation?: string, originalCommitted?: string }} sessionData
 * @returns {string} path of the previous page
 */
function getBackLinkPath({ variation, originalCommitted } = {}) {
  if (variation !== 'yes') {
    return variationPath
  }

  return originalCommitted === 'yes'
    ? originalReferencePath
    : originalCommittedPath
}

export default function getViewModel(sessionData) {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: getBackLinkPath(sessionData),
    defraAccountUserTypeOptions
  }
}
