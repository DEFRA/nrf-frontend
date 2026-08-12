import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as routePathConfirmHousing } from '../confirm-housing/routes.js'
import { routePath as checkYourAnswersPath } from '../check-your-answers/routes.js'

const pageHeading = 'Enter the maximum number of units you are developing'
const pageTitle = 'Number of units'

export default function getViewModel(_quoteData, query = {}) {
  let backLinkPath = routePathConfirmHousing
  if (query.change && query.change === 'true') {
    backLinkPath = checkYourAnswersPath
  }

  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath
  }
}
