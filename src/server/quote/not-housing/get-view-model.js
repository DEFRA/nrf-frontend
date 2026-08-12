import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as confirmHousingPath } from '../confirm-housing/routes.js'

const pageHeading =
  'Nature restoration levy is only available for housing units'
const pageTitle = 'Not housing'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: confirmHousingPath
  }
}
