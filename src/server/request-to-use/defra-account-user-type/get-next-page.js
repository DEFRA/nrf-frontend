import { routePath as enterAddressPath } from '../enter-address/route-path.js'
import { routePath as defraAccountIndividualPath } from '../defra-account-individual/route-path.js'
import { routePath as defraAccountOrganisationPath } from '../defra-account-organisation/route-path.js'
import { routePath as defraAccountAgentPath } from '../defra-account-agent/route-path.js'

/**
 * Each answer goes to its own Defra account page. Enter address requires sign-in, so this is
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

  if (data.defraId?.userType === 'agent') {
    return defraAccountAgentPath
  }

  return enterAddressPath
}
