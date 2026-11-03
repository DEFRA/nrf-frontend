import { saveQuoteDataToCache } from '../quote-session-cache/index.js'
import {
  isChangeMode as isChangeModeFromQuery,
  isDropoutPage
} from '../change-mode/index.js'

/**
 * Wraps a question page's save so an ineligible answer changed from an
 * answers page never reaches the quote cache: the dropout page still shows,
 * but the session keeps the last eligible answer, so backing out of the
 * dropout — via the question page — returns to an answers page that renders
 * the quotable state unchanged. Change mode defaults to the quote journey's
 * ?change=true query (an edit from check-your-answers); the request to use
 * change pages exist only in change mode and override the check. A first-run
 * submission (no change=true) still saves, so the forward journey's dropout
 * handling — including the guard that holds an ineligible first-run answer
 * on its dropout page — is untouched.
 * @param {object} params
 * @param {(sessionData: object | null) => string} params.getNextPage - the page's next-page decision, called on the submitted payload (single-question pages carry the field it reads)
 * @param {Function} [params.saveToSession] - the page's save
 * @param {(query: object) => boolean} [params.isChangeMode] - whether the request changes a previous answer (default: the quote journey's ?change=true check)
 * @returns {(request: import('@hapi/hapi').Request, payload: object) => object} the payload unsaved when a change-mode POST leads to a dropout page, else the saved session data
 */
export const saveToSessionUnlessDropout =
  ({
    getNextPage,
    saveToSession = saveQuoteDataToCache,
    isChangeMode = isChangeModeFromQuery
  }) =>
  (request, payload) =>
    isChangeMode(request.query) && isDropoutPage(getNextPage(payload))
      ? payload
      : saveToSession(request, payload)
