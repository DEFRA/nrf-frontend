import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'
import { routePath as boundaryTypePath } from '../boundary-type/routes.js'
import { config } from '../../../config/config.js'

export const title = 'Boundary Map'

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

  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    boundaryGeojson: JSON.stringify(geometry),
    intersectingEdps,
    intersectsEdp,
    edpBoundaryGeojson,
    edpIntersectionGeojson,
    featureCount,
    backLinkPath: uploadBoundaryPath,
    uploadBoundaryPath,
    cancelPath: boundaryTypePath,
    mapStyleUrl: config.get('map.styleUrl')
  }
}
