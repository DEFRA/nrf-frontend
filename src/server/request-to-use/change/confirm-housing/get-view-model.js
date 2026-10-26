import getConfirmHousingViewModel from '../../../quote/confirm-housing/get-view-model.js'
import { routePath as reviewQuoteDetailsPath } from '../../review-quote-details/route-path.js'
import { withBackLink } from '../../helpers/change-answer/index.js'

export default withBackLink({
  backLinkPath: reviewQuoteDetailsPath,
  getQuotePageViewModel: getConfirmHousingViewModel
})
