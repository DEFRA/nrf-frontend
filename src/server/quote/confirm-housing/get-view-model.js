import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as planningTypePath } from '../planning-type/routes.js'

const pageHeading = 'Are you developing housing units?'
const pageTitle = 'Confirm housing'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: planningTypePath
  }
}
