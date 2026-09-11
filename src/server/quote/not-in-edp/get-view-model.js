import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as drawBoundaryPath } from '../draw-boundary/routes.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'
import { routePath as boundaryTypePath } from '../boundary-type/routes.js'
import { createLogger } from '../../common/helpers/logging/logger.js'
import { appendChangeParam } from '../helpers/change-mode/index.js'

const pageHeading = 'Nature restoration levy is not available in this area'
const pageTitle = 'Not in EDP'
const logger = createLogger()

/**
 * @param {object} [quoteData] - the cached quote data; read for the boundary
 * entry type so the back link returns to the page the boundary came from
 * @param {object} [query] - the parsed request query
 * @returns {object} view model for the not-in-edp page
 */
export default function getViewModel(quoteData = {}, query = {}) {
  let backLinkPath = boundaryTypePath
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
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: appendChangeParam(backLinkPath, query)
  }
}
