import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as checkYourAnswersPath } from '../check-your-answers/routes.js'
import { routePath as startPagePath } from '../../manage/start-page/routes.js'
import { planningTypeOptions } from './options.js'

const title = 'What type of planning application are you planning to submit?'

export default function getViewModel(_quoteData, query = {}) {
  let backLinkPath = startPagePath
  if (query.change && query.change === 'true') {
    backLinkPath = checkYourAnswersPath
  }

  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath,
    planningTypeOptions
  }
}
