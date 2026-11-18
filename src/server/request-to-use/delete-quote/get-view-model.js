import getQuoteDeleteQuoteViewModel from '../../quote/delete-quote/get-view-model.js'
import { routePath as acceptLevyPath } from '../accept-levy/route-path.js'

/**
 * The alias serves the quote delete quote page's own template, so the view
 * model spreads the quote page's and repoints the links at the accept levy
 * page: the page is reached by declining the levy amount, and both links
 * return there. The check your answers page's Delete quote details link
 * reaches this page's own change alias instead.
 * @returns {object} view model for the request to use delete quote page
 */
export default function getViewModel() {
  return {
    ...getQuoteDeleteQuoteViewModel(),
    backLinkPath: acceptLevyPath,
    cancelLinkPath: acceptLevyPath
  }
}
