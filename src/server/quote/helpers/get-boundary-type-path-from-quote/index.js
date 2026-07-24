import { routePath as drawBoundaryPath } from '../../draw-boundary/routes.js'
import { routePath as uploadBoundaryPath } from '../../upload-boundary/routes.js'
import { routePath as boundaryTypePath } from '../../boundary-type/routes.js'
import { createLogger } from '../../../common/helpers/logging/logger.js'

const logger = createLogger()

const getBoundaryTypePathFromQuote = (quoteData = {}) => {
  /**
   * TODO: store the list of possible boundary entry types in a single location and import it here, rather than hardcoding the values in this function.
   */
  if (quoteData.boundaryEntryType === 'draw') {
    return drawBoundaryPath
  } else if (quoteData.boundaryEntryType === 'upload') {
    return uploadBoundaryPath
  } else {
    logger.error(
      { boundaryEntryType: quoteData.boundaryEntryType },
      'boundaryEntryType is not recognised'
    )
    return boundaryTypePath
  }
}

export default getBoundaryTypePathFromQuote
