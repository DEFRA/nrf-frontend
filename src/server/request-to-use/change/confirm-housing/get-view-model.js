import getConfirmHousingViewModel from '../../../quote/confirm-housing/get-view-model.js'
import getNextPage from '../../../quote/confirm-housing/get-next-page.js'
import { withBackLinkUnlessDropout } from '../../helpers/change-answer/index.js'

export default withBackLinkUnlessDropout({
  getNextPage,
  getQuotePageViewModel: getConfirmHousingViewModel
})
