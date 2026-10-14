import { createPostController } from '../common/controllers/post-controller.js'
import { saveQuoteDataToCache } from './helpers/quote-session-cache/index.js'
import { routePath as checkYourAnswersPath } from './check-your-answers/route-path.js'
import {
  appendChangeParam,
  isChangeMode,
  isDropoutPage
} from './helpers/change-mode/index.js'

/**
 * Resolves the redirect target after a quote form POST. Dropout pages win
 * over the return to check-your-answers: an ineligible answer must still
 * show its dropout page, carrying change=true so the page's back link keeps
 * change mode alive.
 * @param {object} params
 * @param {string} params.nextPage - journey-derived next page path
 * @param {object} params.query - the parsed request query
 * @param {boolean} [params.continueToNextPageInChangeMode=false] - when true,
 *   a change-mode POST still follows nextPage (without change=true). For
 *   pages like boundary-type whose answer starts a sub-journey (draw or
 *   upload) that must run in normal mode before the user returns to
 *   check-your-answers.
 * @returns {string} redirect path
 */
export const resolveChangeModeRedirect = ({
  nextPage,
  query,
  continueToNextPageInChangeMode = false
}) => {
  if (isDropoutPage(nextPage)) {
    return appendChangeParam(nextPage, query)
  }
  if (isChangeMode(query) && !continueToNextPageInChangeMode) {
    return checkYourAnswersPath
  }
  return nextPage
}

export const quotePostController = ({
  formValidation,
  getNextPage,
  payloadOptions,
  continueToNextPageInChangeMode = false
}) =>
  createPostController({
    formValidation,
    getNextPage,
    payloadOptions,
    saveToSession: saveQuoteDataToCache,
    resolveRedirect: ({ nextPage, request }) =>
      resolveChangeModeRedirect({
        nextPage,
        query: request.query,
        continueToNextPageInChangeMode
      })
  })
