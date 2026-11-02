import { routePath as defraAccountUserTypePath } from '../defra-account-user-type/route-path.js'
import { routePath as deleteQuotePath } from '../delete-quote/route-path.js'

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
