import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as drawBoundaryPath } from '../draw-boundary/routes.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'
import { routePath as boundaryTypePath } from '../boundary-type/routes.js'
import { createLogger } from '../../common/helpers/logging/logger.js'
import { appendChangeParam } from '../helpers/change-mode/index.js'

const pageHeading =
  'Development is within the excluded area of this Environmental Delivery Plan (EDP)'
const pageTitle = 'Excluded area'
const logger = createLogger()

/**
 * @param {object} [quoteData] - the cached quote data; read for the boundary
 * entry type and the intersecting EDP/exclusion labels
 * @param {object} [query] - the parsed request query
 * @returns {object} view model for the excluded-area page
 */
export default function getViewModel(quoteData = {}, query = {}) {
  let backLinkPath = boundaryTypePath
  const { boundaryEntryType, boundaryGeojson } = quoteData
  /**
   * TODO: store the list of possible boundary entry types in a single location and import it here, rather than hardcoding the values in this function.
   */
  if (boundaryEntryType === 'draw') {
    backLinkPath = drawBoundaryPath
  } else if (boundaryEntryType === 'upload') {
    backLinkPath = uploadBoundaryPath
  } else {
    logger.error({ boundaryEntryType }, 'boundaryEntryType is not recognised')
  }

  const rlbEdp = boundaryGeojson.intersectingEdps?.[0]
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
