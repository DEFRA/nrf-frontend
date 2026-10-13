import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as checkYourAnswersPath } from '../check-your-answers/route-path.js'
import { routePath as whatWouldYouLikeToDoPath } from '../../manage/what-would-you-like-to-do/route-path.js'
import { isChangeMode } from '../helpers/change-mode/index.js'
import { planningTypeOptions } from './options.js'

const pageHeading =
  'What type of planning application are you planning to submit?'
const pageTitle = 'What type of planning application'

export default function getViewModel(_quoteData, query = {}) {
  let backLinkPath = whatWouldYouLikeToDoPath
  if (isChangeMode(query)) {
    backLinkPath = checkYourAnswersPath
  }

  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath,
    planningTypeOptions
  }
}
