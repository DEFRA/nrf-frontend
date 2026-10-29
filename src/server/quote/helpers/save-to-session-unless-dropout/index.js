import { saveQuoteDataToCache } from '../quote-session-cache/index.js'
import { isChangeMode, isDropoutPage } from '../change-mode/index.js'

/**
 * Wraps a question page's save so an ineligible answer changed from
 * check-your-answers never reaches the quote cache: the dropout page still
 * shows, but the session keeps the last eligible answer, so backing out of
 * the dropout — via the question page — returns to a check-your-answers page
 * that renders the quotable state unchanged. A first-run submission (no
 * change=true) still saves, so the forward journey's dropout handling —
 * including the guard that holds an ineligible first-run answer on its
 * dropout page — is untouched.
 * @param {object} params
 * @param {(sessionData: object | null) => string} params.getNextPage - the page's next-page decision, called on the submitted payload (single-question pages carry the field it reads)
 * @param {Function} [params.saveToSession] - the page's save
 * @returns {(request: import('@hapi/hapi').Request, payload: object) => object} the payload unsaved when a change-mode POST leads to a dropout page, else the saved session data
 */
export const saveToSessionUnlessDropout =
  ({ getNextPage, saveToSession = saveQuoteDataToCache }) =>
  (request, payload) =>
    isChangeMode(request.query) && isDropoutPage(getNextPage(payload))
      ? payload
      : saveToSession(request, payload)
