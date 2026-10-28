import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as defraAccountUserTypePath } from '../defra-account-user-type/route-path.js'
import { routePath as enterAddressPath } from '../enter-address/route-path.js'

export const pageHeading =
  "You'll need to create or sign in to a Defra account as an individual"

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: defraAccountUserTypePath,
    continuePath: enterAddressPath
  }
}
