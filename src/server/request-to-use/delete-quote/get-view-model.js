import getQuoteDeleteQuoteViewModel from '../../quote/delete-quote/get-view-model.js'
import { isChangeMode } from '../../quote/helpers/change-mode/index.js'
import { routePath as acceptLevyPath } from '../accept-levy/route-path.js'
import { routePath as checkYourAnswersPath } from '../check-your-answers/route-path.js'

/**
 * The alias serves the quote delete quote page's own template, so the view
 * model spreads the quote page's and repoints the links at the request to use
 * journey: the page is reached by declining the levy amount on the accept
 * levy page, whose back link returns there, unless the change flag marks an
 * arrival from the check your answers page, whose back link returns there.
 * @param {object} [_quoteData] - unused: the quote page's view model reads none
 * @param {object} [query] - the parsed request query
 * @returns {object} view model for the request to use delete quote page
 */
export default function getViewModel(_quoteData, query = {}) {
  return {
    ...getQuoteDeleteQuoteViewModel(),
    backLinkPath: isChangeMode(query) ? checkYourAnswersPath : acceptLevyPath,
    cancelLinkPath: acceptLevyPath
  }
}
