import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as routePathBoundaryType } from '../boundary-type/routes.js'

export const title = 'Enter your email address'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath: routePathBoundaryType
  }
}
