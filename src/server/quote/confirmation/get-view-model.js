import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as checkYourAnswersRoute } from '../check-your-answers/routes.js'

const pageHeading = 'Your details have been submitted'
const pageTitle = 'Confirmation'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: checkYourAnswersRoute
  }
}
