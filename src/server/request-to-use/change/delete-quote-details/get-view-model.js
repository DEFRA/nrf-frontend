import getQuoteDeleteQuoteViewModel from '../../../quote/delete-quote/get-view-model.js'
import { checkYourAnswersBackLinkPath } from '../../helpers/change-answer/index.js'

/**
 * The alias serves the quote delete quote page's own template, so the view
 * model spreads the quote page's and repoints both links at the check your
 * answers page: the page is reached by its Delete quote details link, and
 * backing out either way returns there.
 * @returns {object} view model for the change delete quote details page
 */
export default function getViewModel() {
  return {
    ...getQuoteDeleteQuoteViewModel(),
    backLinkPath: checkYourAnswersBackLinkPath,
    cancelLinkPath: checkYourAnswersBackLinkPath
  }
}
