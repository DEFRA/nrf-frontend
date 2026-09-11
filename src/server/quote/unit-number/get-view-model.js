import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as routePathConfirmHousing } from '../confirm-housing/route-path.js'
import { routePath as checkYourAnswersPath } from '../check-your-answers/route-path.js'
import { isChangeMode } from '../helpers/change-mode/index.js'

const pageHeading = 'Enter the maximum number of units you are developing'
const pageTitle = 'Number of units'

export default function getViewModel(_quoteData, query = {}) {
  let backLinkPath = routePathConfirmHousing
  if (isChangeMode(query)) {
    backLinkPath = checkYourAnswersPath
  }

  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath
  }
}
