import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as drawBoundaryPath } from '../draw-boundary/routes.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'
import { routePath as boundaryTypePath } from '../boundary-type/route-path.js'
import { routePath as changeDrawBoundaryPath } from '../../request-to-use/change/draw-boundary/route-path.js'
import { routePath as changeUploadBoundaryPath } from '../../request-to-use/change/upload-boundary/route-path.js'
import { routePath as changeBoundaryTypePath } from '../../request-to-use/change/boundary-type/route-path.js'
import { createLogger } from '../../common/helpers/logging/logger.js'
import { appendChangeParam } from '../helpers/change-mode/index.js'
import { hasRequestToUseSession } from '../helpers/is-quote-session-in-progress/index.js'

const pageHeading = 'Nature restoration levy is not available in this area'
const pageTitle = 'Not in EDP'
const logger = createLogger()

/**
 * @param {object} [quoteData] - the cached quote data; read for the boundary
 * entry type so the back link returns to the page the boundary came from
 * @param {object} [query] - the parsed request query
 * @param {import('@hapi/hapi').Request} [request] - the request, so the page
 * can read the session itself
 * @returns {object} view model for the not-in-edp page
 */
export default function getViewModel(quoteData = {}, query = {}, request) {
  // An edit from the review page goes back to the change alias's boundary
  // steps; the quote journey's own pages would bounce it to the start page.
  const editingSavedQuote = hasRequestToUseSession(request)
  let backLinkPath = editingSavedQuote
    ? changeBoundaryTypePath
    : boundaryTypePath
  /**
   * TODO: store the list of possible boundary entry types in a single location and import it here, rather than hardcoding the values in this function.
   */
  if (quoteData.boundaryEntryType === 'draw') {
    backLinkPath = editingSavedQuote ? changeDrawBoundaryPath : drawBoundaryPath
  } else if (quoteData.boundaryEntryType === 'upload') {
    backLinkPath = editingSavedQuote
      ? changeUploadBoundaryPath
      : uploadBoundaryPath
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
