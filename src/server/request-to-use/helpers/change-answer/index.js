import { isDropoutPage } from '../../../quote/helpers/change-mode/index.js'
import { routePath as reviewQuoteDetailsPath } from '../../review-quote-details/route-path.js'

/**
 * Wraps a quote question page's view model for its change alias: the alias
 * serves the quote page's own template, so the view model spreads the quote
 * page's and swaps the back link — an edit from the review page returns
 * there, not to the quote journey's previous page.
 * @param {object} params
 * @param {string} params.backLinkPath - where the change page's back link goes
 * @param {Function} params.getQuotePageViewModel - the quote page's view model
 * @returns {(quoteData: object, query: object) => object} the change page's view model
 */
export const withBackLink =
  ({ backLinkPath, getQuotePageViewModel }) =>
  (quoteData, query) => ({
    ...getQuotePageViewModel(quoteData, query),
    backLinkPath
  })

/**
 * A saved edit returns to the review page rather than continuing the quote
 * journey. Dropout pages still win: an ineligible answer must show its dropout
 * page (their behaviour when reached from a change link is NRF2-1314).
 * @param {{ nextPage: string }} params
 * @returns {string} redirect path
 */
export const redirectToReviewPageUnlessDropout = ({ nextPage }) =>
  isDropoutPage(nextPage) ? nextPage : reviewQuoteDetailsPath
