import getOriginalCommittedViewModel from '../../original-committed/get-view-model.js'
import { routePath as checkYourAnswersPath } from '../../check-your-answers/route-path.js'
import { withBackLink } from '../../helpers/change-answer/index.js'

export default withBackLink({
  backLinkPath: checkYourAnswersPath,
  getQuotePageViewModel: getOriginalCommittedViewModel
})
