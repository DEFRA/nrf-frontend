import getQuoteDeleteQuoteViewModel from '../../../quote/delete-quote/get-view-model.js'
import { routePath as checkYourAnswersPath } from '../../check-your-answers/route-path.js'

/**
 * The change alias serves the quote delete quote page's own template, so the
 * view model spreads the quote page's and repoints both links at the check
 * your answers page: the page is reached by the Delete quote details link
 * there, and backing out either way returns to it.
 * @returns {object} view model for the change delete quote page
 */
export default function getViewModel() {
  return {
    ...getQuoteDeleteQuoteViewModel(),
    backLinkPath: checkYourAnswersPath,
    cancelLinkPath: checkYourAnswersPath
  }
}
