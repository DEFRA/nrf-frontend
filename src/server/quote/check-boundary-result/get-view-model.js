import { getPageTitle } from '../../common/helpers/page-title.js'

export const title = 'Check your boundary'

export default function getViewModel(boundaryGeojson) {
  const featureCount = boundaryGeojson?.features?.length ?? 0

  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    boundaryGeojson: JSON.stringify(boundaryGeojson),
    featureCount,
    backLinkPath: '/quote/upload-boundary'
  }
}
