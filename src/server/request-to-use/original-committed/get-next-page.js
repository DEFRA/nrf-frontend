import { routePath as defraAccountUserTypePath } from '../defra-account-user-type/route-path.js'

// Literal path until the original reference page exists.
// Swap for an import of its route-path.js when it is built.
const originalReferencePath = '/request-to-use/original-reference'

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
