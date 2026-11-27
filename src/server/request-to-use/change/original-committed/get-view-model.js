import getOriginalCommittedViewModel from '../../original-committed/get-view-model.js'
import {
  checkYourAnswersBackLinkPath,
  withBackLink
} from '../../helpers/change-answer/index.js'

export default withBackLink({
  backLinkPath: checkYourAnswersBackLinkPath,
  getQuotePageViewModel: getOriginalCommittedViewModel
})
