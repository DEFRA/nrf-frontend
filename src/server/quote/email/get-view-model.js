import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as drawBoundaryPath } from '../draw-boundary/routes.js'
import { routePath as filePreviewPath } from '../file-preview/routes.js'
import { routePath as boundaryTypePath } from '../boundary-type/routes.js'
import { routePath as checkYourAnswersPath } from '../check-your-answers/routes.js'
import { createLogger } from '../../common/helpers/logging/logger.js'

const pageHeading = 'Enter your email address'
const pageTitle = 'Email address'
const logger = createLogger()

export default function getViewModel(quoteData = {}, query = {}) {
  let backLinkPath = boundaryTypePath
  /**
   * TODO: store the list of possible boundary entry types in a single location and import it here, rather than hardcoding the values in this function.
   * */

  if (quoteData.boundaryEntryType === 'draw') {
    backLinkPath = drawBoundaryPath
  } else if (quoteData.boundaryEntryType === 'upload') {
    backLinkPath = filePreviewPath
  } else {
    logger.error(
      { boundaryEntryType: quoteData.boundaryEntryType },
      'boundaryEntryType is not recognised'
    )
  }

  // When editing from check-your-answers, always return there regardless of how the boundary was entered
  if (query.change && query.change === 'true') {
    backLinkPath = checkYourAnswersPath
  }

  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath
  }
}
