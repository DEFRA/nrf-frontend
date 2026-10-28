import { routePath as enterAddressPath } from '../enter-address/route-path.js'
import { routePath as defraAccountIndividualPath } from '../defra-account-individual/route-path.js'
import { routePath as defraAccountOrganisationPath } from '../defra-account-organisation/route-path.js'

/**
 * The individual and organisation answers go to their Defra account pages.
 * The agent answer goes to enter address for now: its Defra account page is
 * not built yet. Enter address requires sign-in, so this is
 * also where a signed-out user is sent to Defra ID.
 * @param {{ defraId?: { userType?: string } }} data - the merged request to use session data
 * @returns {string} path of the page to redirect to
 */
export default function getNextPage(data = {}) {
  if (data.defraId?.userType === 'individual') {
    return defraAccountIndividualPath
  }

  if (data.defraId?.userType === 'organisation') {
    return defraAccountOrganisationPath
  }

  return enterAddressPath
}
