import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as housingUnitsPath } from '../unit-number/routes.js'
import { routePath as checkYourAnswersPath } from '../check-your-answers/route-path.js'
import { isChangeMode } from '../helpers/change-mode/index.js'
import { BOUNDARY_UPLOAD_HINT_TEXT } from '../../common/constants/boundary-upload-hint.js'

const pageHeading =
  'Choose how you would like to show us the boundary of your development'
const pageTitle = 'Boundary type'

export default function getViewModel(quoteData = {}, query = {}) {
  // In change mode the back link returns to check-your-answers — but only
  // while the quote is still complete enough to render it. Posting a
  // different boundary entry type nulls boundaryGeojson (see
  // saveQuoteDataToCache), so a stale boundary-type?change=true reached via
  // the browser back button falls back to the normal back link instead of a
  // 400 dead end.
  const backLinkPath =
    isChangeMode(query) && quoteData?.boundaryGeojson
      ? checkYourAnswersPath
      : housingUnitsPath

  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath,
    boundaryUploadHint: BOUNDARY_UPLOAD_HINT_TEXT
  }
}
