import getQuoteDeleteQuoteViewModel from '../../../quote/delete-quote/get-view-model.js'
import { routePath as changeAcceptLevyPath } from '../accept-levy/route-path.js'

/**
 * The change alias serves the quote delete quote page's own template, so the
 * view model spreads the quote page's and repoints both links at the change
 * accept levy page: deleting the quote is declining the levy amount, and an
 * edit started from the check your answers page backs out to that question's
 * change alias, whose own back link returns to the check your answers page.
 * @returns {object} view model for the change delete quote page
 */
export default function getViewModel() {
  return {
    ...getQuoteDeleteQuoteViewModel(),
    backLinkPath: changeAcceptLevyPath,
    cancelLinkPath: changeAcceptLevyPath
  }
}
