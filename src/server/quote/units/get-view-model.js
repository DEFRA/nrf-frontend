import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as routePathConfirmHousing } from '../confirm-housing/routes.js'

const title = 'Enter the maximum number of units you are developing'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath: routePathConfirmHousing
  }
}
