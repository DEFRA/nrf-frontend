import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as housingUnitsPath } from '../unit-number/routes.js'
import { BOUNDARY_UPLOAD_HINT_TEXT } from '../../common/constants/boundary-upload-hint.js'

const pageHeading =
  'Choose how you would like to show us the boundary of your development'
const pageTitle = 'Boundary type'

export default function () {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: housingUnitsPath,
    boundaryUploadHint: BOUNDARY_UPLOAD_HINT_TEXT
  }
}
