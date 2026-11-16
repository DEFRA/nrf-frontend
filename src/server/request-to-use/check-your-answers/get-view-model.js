import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as readThisPath } from '../read-this/route-path.js'

export const pageHeading = 'Check your answers'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: readThisPath
  }
}
