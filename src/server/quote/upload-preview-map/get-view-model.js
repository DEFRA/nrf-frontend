import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'
import { routePath as drawBoundaryPath } from '../draw-boundary/routes.js'
import { routePath as boundaryTypePath } from '../boundary-type/routes.js'
import { getBoundaryErrorMessage } from '../../common/constants/boundary-error-messages.js'

export const title = 'Your uploaded red line boundary file'
export const errorTitle = 'Your red line boundary file contains an error'

function getMapStyleUrl() {
  return '/os-base-map/resources/styles'
}

/**
 * @param {object} params
 * @param {object} [params.boundaryGeojson]
 * @param {string} [params.boundaryFailureReason]
 * @param {string} [params.boundaryFilename]
 */
export default function getViewModel({
  boundaryGeojson,
  boundaryFailureReason = null,
  boundaryFilename = null
}) {
  const geometry = boundaryGeojson?.boundaryGeometryWgs84 ?? null
  const existingBoundaryMetadata = boundaryGeojson?.boundaryMetadata ?? null
  const intersectingEdps = boundaryGeojson?.intersectingEdps ?? []
  const intersectsEdp = intersectingEdps.length > 0
  const featureCount = 1

  const edpBoundaryGeojson = JSON.stringify({
    type: 'FeatureCollection',
    features: intersectingEdps
      .filter((edp) => edp.edp_geometry)
      .map((edp) => ({
        type: 'Feature',
        geometry: edp.edp_geometry,
        properties: { label: edp.label }
      }))
  })

  const edpIntersectionGeojson = JSON.stringify({
    type: 'FeatureCollection',
    features: intersectingEdps
      .filter((edp) => edp.intersection_geometry)
      .map((edp) => ({
        type: 'Feature',
        geometry: edp.intersection_geometry,
        properties: {
          label: edp.label,
          overlap_area_ha: edp.overlap_area_ha,
          overlap_percentage: edp.overlap_percentage
        }
      }))
  })

  const mappedEdps = intersectingEdps.map((edp) => ({
    ...edp,
    natura2000SiteName: edp.n2k_site_name // n2k = Natura 2000 (EU protected sites network)
  }))

  const pageTitleText = boundaryFailureReason ? errorTitle : title

  // Only render the map when there is geometry to draw. Errors like an
  // unsupported/missing CRS or a rejected upload parse no geometry, so the
  // map would be empty; geometry errors (e.g. self-intersecting) still carry
  // the parsed shape and are worth showing.
  const showMap = geometry != null

  return {
    pageTitle: getPageTitle(pageTitleText),
    pageHeading: pageTitleText,
    boundaryGeojson: JSON.stringify(geometry),
    existingBoundaryMetadata: JSON.stringify(existingBoundaryMetadata),
    intersectingEdps: mappedEdps,
    intersectsEdp,
    showMap,
    edpBoundaryGeojson,
    edpIntersectionGeojson,
    featureCount,
    backLinkPath: uploadBoundaryPath,
    uploadBoundaryPath,
    drawBoundaryPath,
    boundaryError: boundaryFailureReason
      ? getBoundaryErrorMessage(boundaryFailureReason)
      : null,
    boundaryFilename,
    boundaryTypePath,
    mapStyleUrl: getMapStyleUrl(),
    uploadStatus: boundaryFailureReason ? 'failure' : 'success',
    failureReason: boundaryFailureReason
  }
}
