import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as housingUnitsPath } from '../units/routes.js'
import { BOUNDARY_UPLOAD_HINT_TEXT } from '../../common/constants/boundary-upload-hint.js'

export const title =
  'Choose how you would like to show us the boundary of your development'

export default function () {
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath: housingUnitsPath,
    boundaryUploadHint: BOUNDARY_UPLOAD_HINT_TEXT
  }
}
