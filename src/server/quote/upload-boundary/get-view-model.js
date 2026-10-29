import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as routePathBoundaryType } from '../boundary-type/route-path.js'
import { appendChangeParam } from '../helpers/change-mode/index.js'
import { BOUNDARY_UPLOAD_HINT_TEXT } from '../../common/constants/boundary-upload-hint.js'

const pageHeading = 'Upload a red line boundary file'
const pageTitle = 'Upload boundary'

/**
 * @param {object} _quoteData - unused: the page renders no cached answers
 * @param {object} [query] - the parsed request query
 * @returns {object} view model for the upload-boundary page
 */
export default function getViewModel(_quoteData, query = {}) {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: appendChangeParam(routePathBoundaryType, query),
    boundaryUploadHint: BOUNDARY_UPLOAD_HINT_TEXT
  }
}
