import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as drawBoundaryPath } from '../draw-boundary/routes.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'

const title =
  'Development is within the excluded area of this Environmental Delivery Plan (EDP)'

export default function getViewModel(quoteData = {}) {
  let backLinkPath = '#'
  /**
   * TODO: store the list of possible boundary entry types in a single location and import it here, rather than hardcoding the values in this function.
   */

  if (quoteData.boundaryEntryType === 'draw') {
    backLinkPath = drawBoundaryPath
  } else if (quoteData.boundaryEntryType === 'upload') {
    backLinkPath = uploadBoundaryPath
  }

  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath
  }
}
