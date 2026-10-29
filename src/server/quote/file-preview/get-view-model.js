import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'
import { routePath as boundaryTypePath } from '../boundary-type/route-path.js'
import { appendChangeParam } from '../helpers/change-mode/index.js'
import { getBoundaryErrorMessage } from '../../common/constants/boundary-error-messages.js'

const pageHeading = 'Your uploaded red line boundary file'
export const errorTitle = 'Your red line boundary file contains an error'
const pageTitle = 'File preview'

/**
 * @param {object} params
 * @param {object} [params.boundaryGeojson]
 * @param {string} [params.boundaryFailureReason]
 * @param {string} [params.boundaryFilename]
 * @param {object} [params.query]
 */
export default function getViewModel({
  boundaryGeojson,
  boundaryFailureReason = null,
  boundaryFilename = null,
  query = {}
}) {
  const geometry = boundaryGeojson?.boundaryGeometryWgs84 ?? null
  const existingBoundaryMetadata = boundaryGeojson?.boundaryMetadata ?? null
  const intersectingEdps = boundaryGeojson?.intersectingEdps ?? []
  const intersectsEdp = intersectingEdps.length > 0

  const pageTitleText = boundaryFailureReason ? errorTitle : pageHeading

  // Only render the map when there is geometry to draw. Errors like an
  // unsupported/missing CRS or a rejected upload parse no geometry, so the
  // map would be empty; geometry errors (e.g. self-intersecting) still carry
  // the parsed shape and are worth showing.
  const showMap = geometry != null

  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading: pageTitleText,
    boundaryGeojson: JSON.stringify(geometry),
    existingBoundaryMetadata: JSON.stringify(existingBoundaryMetadata),
    intersectingEdps,
    intersectsEdp,
    showMap,
    // Back returns to the upload page and the retry link to the boundary type
    // page; change mode is carried so the edit keeps returning to
    // check-your-answers instead of continuing the journey.
    backLinkPath: appendChangeParam(uploadBoundaryPath, query),
    uploadBoundaryPath,
    boundaryError: boundaryFailureReason
      ? getBoundaryErrorMessage(boundaryFailureReason)
      : null,
    boundaryFilename,
    boundaryTypePath: appendChangeParam(boundaryTypePath, query),
    uploadStatus: boundaryFailureReason ? 'fail' : 'success',
    failureReason: boundaryFailureReason
  }
}
