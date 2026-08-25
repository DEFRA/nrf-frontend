import { getPageTitle } from '../../common/helpers/page-title.js'
import { routeDeveloperDetails } from '../developer-details/routes.js'
import { routePathCheckYourAnswers } from '../check-your-answers/routes.js'

const pageHeading = 'Review and confirm the developer details'
const pageTitle = pageHeading

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: routeDeveloperDetails,
    changePath: routeDeveloperDetails,
    confirmPath: routePathCheckYourAnswers
  }
}
