import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as routePathCheckYourAnswers } from '../check-your-answers/routes.js'

export const title = 'Are you sure you want to delete this quote?'

export default function () {
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath: routePathCheckYourAnswers
  }
}
