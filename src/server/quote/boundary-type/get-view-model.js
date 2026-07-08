import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as planningTypePath } from '../planning-type/routes.js'

export const title =
  'Choose how you would like to show us the boundary of your development'

export default function () {
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath: planningTypePath
  }
}
