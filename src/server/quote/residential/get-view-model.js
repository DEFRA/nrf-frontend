import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as routePathConfirmHousing } from '../confirm-housing/routes.js'

const title = 'How many residential units in this development?'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath: routePathConfirmHousing
  }
}
