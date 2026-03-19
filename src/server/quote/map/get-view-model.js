import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'
import { routePath as boundaryTypePath } from '../boundary-type/routes.js'

export const title = 'Boundary Map'

function getMapStyleUrl() {
  return '/os-base-map/resources/styles'
}

export default function getViewModel(boundaryGeojson) {
  const geometry = boundaryGeojson?.geometry
  const intersectingEdps = boundaryGeojson?.intersecting_edps ?? []
  const intersectsEdp = boundaryGeojson?.intersects_edp ?? false
  const featureCount = geometry?.features?.length ?? 0

  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    boundaryGeojson: JSON.stringify(geometry),
    intersectingEdps,
    intersectsEdp,
    boundaryResponseJson: JSON.stringify(boundaryGeojson, null, 2),
    featureCount,
    backLinkPath: uploadBoundaryPath,
    uploadBoundaryPath,
    cancelPath: boundaryTypePath,
    mapStyleUrl: getMapStyleUrl()
  }
}
