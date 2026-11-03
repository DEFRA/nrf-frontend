import { routePath as defraAccountUserTypePath } from '../defra-account-user-type/route-path.js'

/**
 * Matching the reference against the original commitment is out of scope
 * (NRF2-1317); every format-valid reference continues for now.
 * @param {object} _formData - the validated payload
 * @returns {string} path of the page to redirect to
 */
export default function getNextPage(_formData = {}) {
  return defraAccountUserTypePath
}
