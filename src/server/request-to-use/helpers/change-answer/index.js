import { isDropoutPage } from '../../../quote/helpers/change-mode/index.js'
import { routePath as reviewQuoteDetailsPath } from '../../review-quote-details/route-path.js'
import { routePath as applicationTypeNotAvailablePath } from '../../../quote/application-type-not-available/route-path.js'
import { routePath as notHousingPath } from '../../../quote/not-housing/route-path.js'
import { routePath as changeApplicationTypeNotAvailablePath } from '../../change/application-type-not-available/route-path.js'
import { routePath as changeNotHousingPath } from '../../change/not-housing/route-path.js'

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

// Quote dropout pages reachable from a change page and their request to use
// change aliases: under the /quote/ prefix the quote journey's session guard
// would bounce a request to use session to the start page, so the dropout must
// render at its alias, guarded by the review quote session instead. The
// boundary dropouts have no alias because they are only reachable while
// drawing a boundary, which no change page can do yet, so they pass through
// bare.
export const dropoutPageAliases = new Map([
  [applicationTypeNotAvailablePath, changeApplicationTypeNotAvailablePath],
  [notHousingPath, changeNotHousingPath]
])

/**
 * A saved edit returns to the review page rather than continuing the quote
 * journey. Dropout pages still win: an ineligible answer is saved like any
 * other and must show its dropout page, at its change alias when one exists.
 * @param {{ nextPage: string }} params
 * @returns {string} redirect path
 */
export const redirectToReviewPageUnlessDropout = ({ nextPage }) =>
  isDropoutPage(nextPage)
    ? (dropoutPageAliases.get(nextPage) ?? nextPage)
    : reviewQuoteDetailsPath
