import getOriginalReferenceViewModel from '../../original-reference/get-view-model.js'
import { routePath as changeOriginalReferenceNotMatchedPath } from '../original-reference-not-matched/route-path.js'
import { routePath as changeOriginalBoundaryNotMatchedPath } from '../original-boundary-not-matched/route-path.js'
import {
  checkYourAnswersBackLinkPath,
  withBackLink
} from '../../helpers/change-answer/index.js'
import {
  boundaryNotMatchedSource,
  referenceNotMatchedSource
} from './not-matched-source.js'

const notMatchedBackLinks = new Map([
  [referenceNotMatchedSource, changeOriginalReferenceNotMatchedPath],
  [boundaryNotMatchedSource, changeOriginalBoundaryNotMatchedPath]
])

/**
 * A retry from a not matched page returns to that page until the reference is
 * corrected; any other edit returns to the check your answers page.
 * @param {import('../../controller-get.js').ViewModelInput} [input]
 * @returns {object} view model for the change original-reference page
 */
export default function getViewModel(input) {
  return withBackLink({
    backLinkPath:
      notMatchedBackLinks.get(input?.query?.from) ??
      checkYourAnswersBackLinkPath,
    getQuotePageViewModel: getOriginalReferenceViewModel
  })(input)
}
