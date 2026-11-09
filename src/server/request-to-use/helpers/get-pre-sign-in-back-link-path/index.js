import { routePath as variationPath } from '../../variation/route-path.js'
import { routePath as originalCommittedPath } from '../../original-committed/route-path.js'
import { routePath as originalReferencePath } from '../../original-reference/route-path.js'

/**
 * The previous page is the last question answered on the way here.
 * Checking variation first ignores a stale originalCommitted answer.
 * @param {{ variation?: string, originalCommitted?: string }} [sessionData]
 * @returns {string} path of the previous question page
 */
export function getPreSignInBackLinkPath({
  variation,
  originalCommitted
} = {}) {
  if (variation !== 'yes') {
    return variationPath
  }

  return originalCommitted === 'yes'
    ? originalReferencePath
    : originalCommittedPath
}
