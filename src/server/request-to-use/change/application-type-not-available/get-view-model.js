import getApplicationTypeNotAvailableViewModel from '../../../quote/application-type-not-available/get-view-model.js'
import { routePath as changePlanningTypePath } from '../planning-type/route-path.js'
import { routePath as reviewQuoteDetailsPath } from '../../review-quote-details/route-path.js'

/**
 * Wraps the quote dropout page's view model for its request to use change
 * alias: the back link returns to the change page the dropout was reached
 * from, or straight to the review page when its Continue button redirected
 * here (from=review).
 * @param {object} quoteData - cached quote answers (the dropout page renders none)
 * @param {object} [query] - the parsed request query
 * @returns {object} view model for the change alias page
 */
export default function getViewModel(quoteData, query = {}) {
  return {
    ...getApplicationTypeNotAvailableViewModel(quoteData, query),
    backLinkPath:
      query.from === 'review' ? reviewQuoteDetailsPath : changePlanningTypePath
  }
}
