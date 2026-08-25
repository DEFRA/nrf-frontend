import { getPageTitle } from '../../common/helpers/page-title.js'
import { routeRetrieveQuoteDetails } from '../retrieve-quote-details/routes.js'

const pageHeading = 'Review and amend your quote details'
const pageTitle = pageHeading

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: routeRetrieveQuoteDetails
  }
}
