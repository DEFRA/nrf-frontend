import getUploadBoundaryViewModel from '../../../quote/upload-boundary/get-view-model.js'
import { routePath as changeBoundaryTypePath } from '../boundary-type/route-path.js'
import { withBackLink } from '../../helpers/change-answer/index.js'

export default withBackLink({
  backLinkPath: changeBoundaryTypePath,
  getQuotePageViewModel: getUploadBoundaryViewModel
})
