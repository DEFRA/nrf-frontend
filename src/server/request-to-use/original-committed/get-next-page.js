import { routePath as originalReferencePath } from '../original-reference/route-path.js'
import { routePath as defraAccountUserTypePath } from '../defra-account-user-type/route-path.js'

/**
 * @param {{ originalCommitted: string }} formData - the request to use session data including the submitted answer
 * @returns {string} path of the page to redirect to
 */
export default function getNextPage({ originalCommitted }) {
  if (originalCommitted === 'yes') {
    return originalReferencePath
  }
  return defraAccountUserTypePath
}
