import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as defraAccountUserTypePath } from '../defra-account-user-type/route-path.js'
import { routePath as enterAddressPath } from '../enter-address/route-path.js'

export const pageHeading =
  'Your client will need to create a Defra account and invite you as an agent or third party'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: defraAccountUserTypePath,
    continuePath: enterAddressPath
  }
}
