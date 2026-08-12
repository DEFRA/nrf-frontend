import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as routePathBoundaryType } from '../boundary-type/routes.js'
import { BOUNDARY_UPLOAD_HINT_TEXT } from '../../common/constants/boundary-upload-hint.js'

export const pageHeading = 'Upload a red line boundary file'
const pageTitle = 'Upload boundary'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: routePathBoundaryType,
    boundaryUploadHint: BOUNDARY_UPLOAD_HINT_TEXT
  }
}
