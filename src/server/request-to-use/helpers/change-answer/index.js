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
// boundary dropouts have no alias yet (NRF2-1315) and no change page can reach
// them today, so they pass through bare.
const dropoutPageAliases = new Map([
  [applicationTypeNotAvailablePath, changeApplicationTypeNotAvailablePath],
  [notHousingPath, changeNotHousingPath]
])

/**
 * A saved edit returns to the review page rather than continuing the quote
 * journey. Dropout pages still win: an ineligible answer must show its dropout
 * page, at its change alias when one exists.
 * @param {{ nextPage: string }} params
 * @returns {string} redirect path
 */
export const redirectToReviewPageUnlessDropout = ({ nextPage }) =>
  dropoutPageAliases.get(nextPage) ??
  (isDropoutPage(nextPage) ? nextPage : reviewQuoteDetailsPath)

/**
 * Wraps a change page's save so an ineligible answer never reaches the quote
 * cache: the dropout page still shows, but the session keeps the last
 * eligible answer, so the review page — and every back link to it — always
 * renders a real, quotable state. A stored quote can never hold an
 * ineligible answer either (those never reach check-your-answers), so an
 * edit that makes the quote ineligible is rejected, not recorded.
 * @param {object} params
 * @param {(sessionData: object | null) => string} params.getNextPage - the quote page's next-page decision, called on the submitted payload (single-question pages carry the field it reads)
 * @param {Function} params.saveToSession - the quote page's save
 * @returns {(request: import('@hapi/hapi').Request, payload: object) => object} the payload unsaved when it leads to a dropout, else the saved session data
 */
export const saveToSessionUnlessDropout =
  ({ getNextPage, saveToSession }) =>
  (request, payload) =>
    isDropoutPage(getNextPage(payload))
      ? payload
      : saveToSession(request, payload)
