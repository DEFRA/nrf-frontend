import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as routePathBoundaryType } from '../boundary-type/routes.js'

export const title = 'Upload a red line boundary file'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath: routePathBoundaryType
  }
}
