import { getPageTitle } from '../../common/helpers/page-title.js'
import { routeNrlReference } from '../nrl-reference/routes.js'

const pageHeading = 'Enter your NRL reference'
const pageTitle = pageHeading

export default function () {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: routeNrlReference
  }
}
