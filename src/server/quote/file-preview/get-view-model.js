import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'
import { routePath as boundaryTypePath } from '../boundary-type/routes.js'
import { routePath as checkYourAnswersPath } from '../check-your-answers/routes.js'
import { getBoundaryErrorMessage } from '../../common/constants/boundary-error-messages.js'

export const pageHeading = 'Your uploaded red line boundary file'
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

  // When editing from check-your-answers, always return there instead of the
  // upload page
  const backLinkPath =
    query.change === 'true' ? checkYourAnswersPath : uploadBoundaryPath

  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading: pageTitleText,
    boundaryGeojson: JSON.stringify(geometry),
    existingBoundaryMetadata: JSON.stringify(existingBoundaryMetadata),
    intersectingEdps,
    intersectsEdp,
    showMap,
    backLinkPath,
    uploadBoundaryPath,
    boundaryError: boundaryFailureReason
      ? getBoundaryErrorMessage(boundaryFailureReason)
      : null,
    boundaryFilename,
    boundaryTypePath,
    uploadStatus: boundaryFailureReason ? 'fail' : 'success',
    failureReason: boundaryFailureReason
  }
}
