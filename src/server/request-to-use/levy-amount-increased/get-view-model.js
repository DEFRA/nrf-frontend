import { getPageTitle } from '../../common/helpers/page-title.js'
import { routeReviewQuoteDetails } from '../review-quote-details/routes.js'

const pageHeading = 'Your levy amount has increased since your quote'
const pageTitle = pageHeading

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: routeReviewQuoteDetails
  }
}
