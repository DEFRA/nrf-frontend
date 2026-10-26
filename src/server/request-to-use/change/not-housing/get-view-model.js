import getNotHousingViewModel from '../../../quote/not-housing/get-view-model.js'
import { routePath as changeConfirmHousingPath } from '../confirm-housing/route-path.js'
import { withBackLink } from '../../helpers/change-answer/index.js'

export default withBackLink({
  backLinkPath: changeConfirmHousingPath,
  getQuotePageViewModel: getNotHousingViewModel
})
