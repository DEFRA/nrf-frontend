import getQuoteDeleteQuoteViewModel from '../../quote/delete-quote/get-view-model.js'
import { routePath as reviewQuoteDetailsPath } from '../review-quote-details/route-path.js'

/**
 * The alias serves the quote delete quote page's own template, so the view
 * model spreads the quote page's and repoints the back link and Cancel link
 * at the review and amend page: the page is reached by declining the levy
 * amount, and both links return there, not to the quote journey's check your
 * answers page.
 * @returns {object} view model for the request to use delete quote page
 */
export default function getViewModel() {
  return {
    ...getQuoteDeleteQuoteViewModel(),
    backLinkPath: reviewQuoteDetailsPath,
    cancelLinkPath: reviewQuoteDetailsPath
  }
}
