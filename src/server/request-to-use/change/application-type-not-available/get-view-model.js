import getApplicationTypeNotAvailableViewModel from '../../../quote/application-type-not-available/get-view-model.js'
import { routePath as changePlanningTypePath } from '../planning-type/route-path.js'
import { withBackLink } from '../../helpers/change-answer/index.js'

export default withBackLink({
  backLinkPath: changePlanningTypePath,
  getQuotePageViewModel: getApplicationTypeNotAvailableViewModel
})
