import getOriginalReferenceNotMatchedViewModel from '../../original-reference-not-matched/get-view-model.js'
import {
  getPathFromNotMatchedPage,
  referenceNotMatchedSource
} from '../original-reference/not-matched-source.js'

/**
 * The change alias serves the original-reference-not-matched page's own
 * template, so the view model spreads the page's and points its links at the
 * change original reference page, which links back here until corrected.
 * @param {import('../../controller-get.js').ViewModelInput} [input]
 * @returns {object} view model for the change original reference not matched page
 */
export default function getViewModel(input) {
  const enterOriginalReferencePath = getPathFromNotMatchedPage(
    referenceNotMatchedSource
  )

  return {
    ...getOriginalReferenceNotMatchedViewModel(input),
    backLinkPath: enterOriginalReferencePath,
    enterOriginalReferencePath
  }
}
