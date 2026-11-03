import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as originalCommittedPath } from '../original-committed/route-path.js'

export const pageHeading =
  'Enter the NRL reference for the original planning permission'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: originalCommittedPath
  }
}
