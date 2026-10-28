import { routePath as defraAccountUserTypePath } from '../defra-account-user-type/route-path.js'

// Literal path: the delete quote page for this journey is not built yet. Swap
// for its route-path import when it exists.
const deleteQuotePath = '/request-to-use/delete-quote'

/**
 * @param {{ acceptLevy: string }} formData - the validated payload
 * @returns {string} path of the page to redirect to
 */
export default function getNextPage({ acceptLevy }) {
  if (acceptLevy === 'yes') {
    return defraAccountUserTypePath
  }

  return deleteQuotePath
}
