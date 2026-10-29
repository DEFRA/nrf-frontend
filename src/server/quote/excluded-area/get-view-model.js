import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as drawBoundaryPath } from '../draw-boundary/routes.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'
import { routePath as boundaryTypePath } from '../boundary-type/route-path.js'
import { appendChangeParam } from '../helpers/change-mode/index.js'
import { resolveBoundaryStepBackLink } from '../helpers/boundary-step-back-link/index.js'

const pageHeading =
  'Development is within the excluded area of this Environmental Delivery Plan (EDP)'
const pageTitle = 'Excluded area'

/**
 * @param {object} [quoteData] - the cached quote data; read for the boundary
 * entry type and the intersecting EDP/exclusion labels
 * @param {object} [query] - the parsed request query
 * @returns {object} view model for the excluded-area page
 */
export default function getViewModel(quoteData = {}, query = {}) {
  const { boundaryEntryType, boundaryGeojson } = quoteData
  const backLinkPath = resolveBoundaryStepBackLink({
    boundaryEntryType,
    drawBoundaryPath,
    uploadBoundaryPath,
    fallbackPath: boundaryTypePath
  })

  const rlbEdp = boundaryGeojson?.intersectingEdps?.[0]
  const rlbCatchment = rlbEdp?.catchments?.[0]?.label
  const rlbCatchment2 = rlbEdp?.catchments?.[1]?.label
  const rlbCatchment3 = rlbEdp?.catchments?.[2]?.label
  const rlbExcludedArea = boundaryGeojson?.intersectingExcludedAreas?.[0]
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: appendChangeParam(backLinkPath, query),
    rlbExcludedArea,
    rlbEdp: rlbEdp?.label,
    rlbCatchment,
    ...(rlbCatchment2 ? { rlbCatchment2 } : {}),
    ...(rlbCatchment3 ? { rlbCatchment3 } : {}),
    rlbOption: boundaryEntryType
  }
}
