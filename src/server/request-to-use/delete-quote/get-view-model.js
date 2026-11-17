import getQuoteDeleteQuoteViewModel from '../../quote/delete-quote/get-view-model.js'
import { routePath as acceptLevyPath } from '../accept-levy/route-path.js'
import { routePath as checkYourAnswersPath } from '../check-your-answers/route-path.js'

/**
 * The alias serves the quote delete quote page's own template, so the view
 * model spreads the quote page's and repoints the links at the request to use
 * journey: the page is reached by the Delete quote details link on the check
 * your answers page, whose back link returns there, while Cancel returns to
 * the accept levy page, the other way in, reached by declining the levy
 * amount.
 * @returns {object} view model for the request to use delete quote page
 */
export default function getViewModel() {
  return {
    ...getQuoteDeleteQuoteViewModel(),
    backLinkPath: checkYourAnswersPath,
    cancelLinkPath: acceptLevyPath
  }
}
