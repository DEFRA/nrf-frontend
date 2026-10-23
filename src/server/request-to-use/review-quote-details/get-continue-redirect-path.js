import { routePath as changeApplicationTypeNotAvailablePath } from '../change/application-type-not-available/route-path.js'
import { routePath as changeNotHousingPath } from '../change/not-housing/route-path.js'
import { routePath as reviewQuoteDetailsPath } from './route-path.js'

// from=review makes the dropout page's back link return straight to the
// review page: the user already answered the question the dropout came from.
const withFromReview = (path) => `${path}?from=review`

/**
 * Where the review page's Continue button redirects: an ineligible saved
 * answer must show its dropout page again, with the review page as the way
 * back. Anything else returns to the review page until the accept the levy
 * page lands (NRF2-1302).
 * @param {object | null} quoteData - cached quote answers
 * @returns {string} redirect path
 */
export const getContinueRedirectPath = (quoteData) => {
  if (quoteData?.planningType === 'other') {
    return withFromReview(changeApplicationTypeNotAvailablePath)
  }
  if (quoteData?.isHousing === 'no') {
    return withFromReview(changeNotHousingPath)
  }
  return reviewQuoteDetailsPath
}
