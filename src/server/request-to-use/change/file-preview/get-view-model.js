import getFilePreviewViewModel from '../../../quote/file-preview/get-view-model.js'
import { routePath as changeBoundaryTypePath } from '../boundary-type/route-path.js'
import { routePath as changeUploadBoundaryPath } from '../upload-boundary/route-path.js'

/**
 * The alias serves the quote file preview page's own template, so the view
 * model spreads the quote page's and repoints its links at the change alias:
 * retrying the upload, drawing instead, and the back link all stay inside the
 * request to use journey.
 * @param {object} viewModelArgs - the file preview view model arguments
 * @returns {object} view model for the change file preview page
 */
export default function getViewModel(viewModelArgs) {
  return {
    ...getFilePreviewViewModel(viewModelArgs),
    backLinkPath: changeUploadBoundaryPath,
    uploadBoundaryPath: changeUploadBoundaryPath,
    boundaryTypePath: changeBoundaryTypePath
  }
}
