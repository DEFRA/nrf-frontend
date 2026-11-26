import getEnterAddressViewModel from '../../enter-address/get-view-model.js'
import { checkYourAnswersBackLinkPath } from '../../helpers/change-answer/index.js'

/**
 * The change alias serves the enter address page's own template, so the view
 * model spreads the page's and repoints the back link: an edit from the
 * check your answers page returns there, not to the last pre-sign-in
 * question.
 * @param {import('../../controller-get.js').ViewModelInput} [input]
 * @returns {object} view model for the change enter address page
 */
export default function getViewModel(input) {
  return {
    ...getEnterAddressViewModel(input),
    backLinkPath: checkYourAnswersBackLinkPath
  }
}
