import getNotInEdpViewModel from '../../../quote/not-in-edp/get-view-model.js'
import { routePath as changeBoundaryTypePath } from '../boundary-type/route-path.js'
import { routePath as changeDrawBoundaryPath } from '../draw-boundary/route-path.js'
import { routePath as changeUploadBoundaryPath } from '../upload-boundary/route-path.js'
import { resolveBoundaryStepBackLink } from '../../../quote/helpers/boundary-step-back-link/index.js'

/**
 * The alias serves the quote dropout page's own template, so the view model
 * spreads the quote page's and repoints the back link at the change alias's
 * boundary steps: an edit from the review page goes back to the boundary page
 * it came from, not to the quote journey's.
 * @param {object} [quoteData] - the quote session data; read for the boundary
 *   entry type so the back link returns to the change page the boundary came
 *   from
 * @returns {object} view model for the change not in EDP page
 */
export default function getViewModel(quoteData = {}) {
  const backLinkPath = resolveBoundaryStepBackLink({
    boundaryEntryType: quoteData.boundaryEntryType,
    drawBoundaryPath: changeDrawBoundaryPath,
    uploadBoundaryPath: changeUploadBoundaryPath,
    fallbackPath: changeBoundaryTypePath
  })

  return {
    ...getNotInEdpViewModel(quoteData),
    backLinkPath
  }
}
