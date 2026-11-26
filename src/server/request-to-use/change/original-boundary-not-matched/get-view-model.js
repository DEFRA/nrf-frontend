import getOriginalBoundaryNotMatchedViewModel from '../../original-boundary-not-matched/get-view-model.js'
import {
  boundaryNotMatchedSource,
  getPathFromNotMatchedPage
} from '../original-reference/not-matched-source.js'

/**
 * The change alias serves the original-boundary-not-matched page's own
 * template, so the view model spreads the page's and points its links at the
 * change original reference page, which links back here until corrected.
 * @param {import('../../controller-get.js').ViewModelInput} [input]
 * @returns {object} view model for the change original boundary not matched page
 */
export default function getViewModel(input) {
  const originalReferencePath = getPathFromNotMatchedPage(
    boundaryNotMatchedSource
  )

  return {
    ...getOriginalBoundaryNotMatchedViewModel(input),
    backLinkPath: originalReferencePath,
    originalReferencePath
  }
}
