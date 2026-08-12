import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as routePathCheckYourAnswers } from '../check-your-answers/routes.js'

export const pageHeading = 'Are you sure you want to delete this quote?'
const pageTitle = 'Delete quote'

export default function () {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: routePathCheckYourAnswers
  }
}
