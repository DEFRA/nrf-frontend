import getOriginalCommittedViewModel from '../../original-committed/get-view-model.js'
import { routePath as checkYourAnswersPath } from '../../check-your-answers/route-path.js'

/**
 * The change alias serves the original-committed page's own template, so the view model
 * spreads the page's and repoints the back link: an edit from the check your
 * answers page returns there.
 * @param {import('../../controller-get.js').ViewModelInput} [input]
 * @returns {object} view model for the change original-committed page
 */
export default function getViewModel(input) {
  return {
    ...getOriginalCommittedViewModel(input),
    backLinkPath: checkYourAnswersPath
  }
}
