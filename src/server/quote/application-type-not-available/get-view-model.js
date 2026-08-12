import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as planningTypePath } from '../planning-type/routes.js'

const pageHeading =
  'Nature restoration levy is not currently available for this planning application type'
const pageTitle = 'Not available for planning type'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: planningTypePath
  }
}
