import { routePath as originalCommittedPath } from '../original-committed/route-path.js'
import { routePath as defraAccountUserTypePath } from '../defra-account-user-type/route-path.js'

/**
 * @param {{ variation: string }} formData - the request to use session data including the submitted answer
 * @returns {string} path of the page to redirect to
 */
export default function getNextPage({ variation }) {
  if (variation === 'yes') {
    return originalCommittedPath
  }

  return defraAccountUserTypePath
}
