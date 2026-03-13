import { getPageTitle } from '../../common/helpers/page-title.js'

export const title = 'Check your boundary'

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
    backLinkPath: '/quote/upload-boundary'
  }
}
