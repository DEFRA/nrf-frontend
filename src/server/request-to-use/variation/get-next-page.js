import { routePath as defraAccountUserTypePath } from '../defra-account-user-type/route-path.js'

// Literal path until the original committed page exists.
// Swap for an import of its route-path.js when it is built.
const originalCommittedPath = '/request-to-use/original-committed'

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
