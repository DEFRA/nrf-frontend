import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as drawBoundaryPath } from '../draw-boundary/routes.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'
import { createLogger } from '../../common/helpers/logging/logger.js'

const title =
  'Development is within the excluded area of this Environmental Delivery Plan (EDP)'

const logger = createLogger()

export default function getViewModel(quoteData = {}) {
  let backLinkPath = '#'
  /**
   * TODO: store the list of possible boundary entry types in a single location and import it here, rather than hardcoding the values in this function.
   */
  if (quoteData.boundaryEntryType === 'draw') {
    backLinkPath = drawBoundaryPath
  } else if (quoteData.boundaryEntryType === 'upload') {
    backLinkPath = uploadBoundaryPath
  } else {
    logger.error(
      { boundaryEntryType: quoteData.boundaryEntryType },
      'boundaryEntryType is not recognised'
    )
  }

  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath
  }
}
