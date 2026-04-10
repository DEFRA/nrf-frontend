import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as uploadPreviewMapPath } from '../upload-preview-map/routes.js'
import { routePath as drawBoundaryPath } from '../draw-boundary/routes.js'

const title = 'What type of development is it?'

export default function getViewModel(quoteData = {}) {
  const backLinkPath =
    quoteData.boundaryEntryType === 'draw'
      ? drawBoundaryPath
      : uploadPreviewMapPath

  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath
  }
}
