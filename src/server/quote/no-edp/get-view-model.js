import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as boundaryTypePath } from '../boundary-type/routes.js'

const title = 'Nature restoration levy is not available in this area'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath: boundaryTypePath
  }
}
