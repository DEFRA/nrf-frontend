import getAcceptLevyViewModel from '../../accept-levy/get-view-model.js'
import { checkYourAnswersBackLinkPath } from '../../helpers/change-answer/index.js'

/**
 * The change alias serves the accept levy page's own template, so the view
 * model spreads the page's and repoints the back link: an edit from the
 * check your answers page returns there, not to the review and amend page.
 * @param {import('../../controller-get.js').ViewModelInput} [input]
 * @returns {object} view model for the change accept levy page
 * @throws {Error} when the session holds no levy, like the page it wraps
 */
export default function getViewModel(input) {
  return {
    ...getAcceptLevyViewModel(input),
    backLinkPath: checkYourAnswersBackLinkPath
  }
}
