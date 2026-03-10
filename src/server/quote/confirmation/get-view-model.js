import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as checkYourAnswersRoute } from '../check-your-answers/routes.js'

export const title = 'Your details have been submitted'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath: checkYourAnswersRoute
  }
}
