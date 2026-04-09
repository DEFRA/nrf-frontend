import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'
import { routePath as drawBoundaryPath } from '../draw-boundary/routes.js'
import { routePath as boundaryTypePath } from '../boundary-type/routes.js'

export const title = 'Boundary Map'

function getMapStyleUrl() {
  return '/os-base-map/resources/styles'
}

export default function getViewModel(
  boundaryGeojson,
  boundaryError = null,
  boundaryFilename = null
) {
  const geometry = boundaryGeojson?.boundaryGeometryWgs84 ?? null
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

  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    boundaryGeojson: JSON.stringify(geometry),
    intersectingEdps: mappedEdps,
    intersectsEdp,
    edpBoundaryGeojson,
    edpIntersectionGeojson,
    featureCount,
    backLinkPath: uploadBoundaryPath,
    uploadBoundaryPath,
    drawBoundaryPath,
    boundaryError,
    boundaryFilename,
    boundaryTypePath,
    mapStyleUrl: getMapStyleUrl()
  }
}
