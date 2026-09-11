import { mapValidationErrorsForDisplay } from '../common/helpers/form-validation.js'
import { saveValidationFlashToCache } from './helpers/form-validation-session/index.js'
import { statusCodes } from '../common/constants/status-codes.js'
import { saveQuoteDataToCache } from './helpers/quote-session-cache/index.js'
import { routePath as checkYourAnswersPath } from './check-your-answers/route-path.js'
import {
  appendChangeParam,
  isChangeMode,
  isDropoutPage
} from './helpers/change-mode/index.js'

/**
 * PRG failAction for quote form POSTs. Saves errors and submitted values to
 * the session flash, then redirects back to the form. The original query
 * string is preserved so change mode survives a validation failure.
 * @param {import('@hapi/hapi').Request} request - Hapi request
 * @param {import('@hapi/hapi').ResponseToolkit} h - response toolkit
 * @param {import('joi').ValidationError} err - validation error
 * @returns {import('@hapi/hapi').Lifecycle.ReturnValue} redirect takeover
 */
export const redirectToFormWithValidationErrors = (request, h, err) => {
  const { payload } = request
  const validationErrors = mapValidationErrorsForDisplay(err.details)
  saveValidationFlashToCache(request, {
    validationErrors,
    formSubmitData: payload
  })
  return h
    .redirect(`${request.path}${request.url.search}`)
    .code(statusCodes.redirectAfterPost)
    .takeover()
}

/**
 * Resolves the redirect target after a quote form POST. Dropout pages win
 * over the return to check-your-answers: an ineligible answer must still
 * show its dropout page, carrying change=true so the page's back link keeps
 * change mode alive.
 * @param {object} params
 * @param {string} params.nextPage - journey-derived next page path
 * @param {object} params.query - the parsed request query
 * @returns {string} redirect path
 */
export const resolveChangeModeRedirect = ({ nextPage, query }) => {
  if (isDropoutPage(nextPage)) {
    return appendChangeParam(nextPage, query)
  }
  if (isChangeMode(query)) {
    return checkYourAnswersPath
  }
  return nextPage
}

export const quotePostController = ({
  formValidation,
  getNextPage,
  payloadOptions
}) => ({
  options: {
    ...(payloadOptions && { payload: payloadOptions }),
    validate: {
      payload: formValidation(),
      failAction: redirectToFormWithValidationErrors
    }
  },
  handler(request, h) {
    const { payload, query } = request
    const quoteData = saveQuoteDataToCache(request, payload)
    const nextPage = getNextPage(quoteData)
    return h
      .redirect(resolveChangeModeRedirect({ nextPage, query }))
      .code(statusCodes.redirectAfterPost)
  }
})
