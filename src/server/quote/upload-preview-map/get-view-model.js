import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'

export const title = 'Boundary Map'

function getMapStyleUrl() {
  return '/os-base-map/resources/styles'
}

export default function getViewModel(boundaryGeojson) {
  const geometry = boundaryGeojson?.geometry
  const intersectingEdps = boundaryGeojson?.intersecting_edps ?? []
  const intersectsEdp = boundaryGeojson?.intersects_edp ?? false
  const featureCount = geometry?.features?.length ?? 0

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
    mapStyleUrl: getMapStyleUrl()
  }
}
