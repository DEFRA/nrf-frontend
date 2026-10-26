import getPlanningTypeViewModel from '../../../quote/planning-type/get-view-model.js'
import getNextPage from '../../../quote/planning-type/get-next-page.js'
import { withBackLinkUnlessDropout } from '../../helpers/change-answer/index.js'

export default withBackLinkUnlessDropout({
  getNextPage,
  getQuotePageViewModel: getPlanningTypeViewModel
})
