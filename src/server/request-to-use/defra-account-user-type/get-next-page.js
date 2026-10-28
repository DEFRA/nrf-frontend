import { routePath as enterAddressPath } from '../enter-address/route-path.js'
import { routePath as defraAccountIndividualPath } from '../defra-account-individual/route-path.js'

/**
 * The individual answer goes to the individual Defra account page. The
 * organisation and agent answers go to enter address for now: their Defra
 * account pages are not built yet. Enter address requires sign-in, so this is
 * also where a signed-out user is sent to Defra ID.
 * @param {{ defraId?: { userType?: string } }} data - the merged request to use session data
 * @returns {string} path of the page to redirect to
 */
export default function getNextPage(data = {}) {
  if (data.defraId?.userType === 'individual') {
    return defraAccountIndividualPath
  }

  return enterAddressPath
}
