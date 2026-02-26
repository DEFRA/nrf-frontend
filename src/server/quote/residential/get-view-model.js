import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as routePathDevelopmentTypes } from '../development-types/routes.js'

const title = 'How many residential units in this development?'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath: routePathDevelopmentTypes
  }
}
