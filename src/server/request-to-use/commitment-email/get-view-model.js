import { getPageTitle } from '../../common/helpers/page-title.js'
import { routeConfirmation } from '../confirmation/routes.js'
import { routeNrlReference } from '../nrl-reference/routes.js'

const pageHeading = 'You have requested to use the nature restoration levy'
const pageTitle = pageHeading

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: routeConfirmation,
    nrlReferencePath: routeNrlReference
  }
}
