import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as confirmHousingPath } from '../confirm-housing/routes.js'

const title = 'Nature restoration levy is only available for housing units'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath: confirmHousingPath
  }
}
