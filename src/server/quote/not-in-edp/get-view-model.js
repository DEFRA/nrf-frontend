import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as drawBoundaryPath } from '../draw-boundary/routes.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'
import { routePath as boundaryTypePath } from '../boundary-type/route-path.js'
import { appendChangeParam } from '../helpers/change-mode/index.js'
import { resolveBoundaryStepBackLink } from '../helpers/boundary-step-back-link/index.js'

const pageHeading = 'Nature restoration levy is not available in this area'
const pageTitle = 'Not in EDP'

/**
 * @param {object} [quoteData] - the cached quote data; read for the boundary
 * entry type so the back link returns to the page the boundary came from
 * @param {object} [query] - the parsed request query
 * @returns {object} view model for the not-in-edp page
 */
export default function getViewModel(quoteData = {}, query = {}) {
  const backLinkPath = resolveBoundaryStepBackLink({
    boundaryEntryType: quoteData.boundaryEntryType,
    drawBoundaryPath,
    uploadBoundaryPath,
    fallbackPath: boundaryTypePath
  })

  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: appendChangeParam(backLinkPath, query)
  }
}
