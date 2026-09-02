import { mapValidationErrorsForDisplay } from '../common/helpers/form-validation.js'
import { saveValidationFlashToCache } from './helpers/form-validation-session/index.js'
import { statusCodes } from '../common/constants/status-codes.js'
import { saveQuoteDataToCache } from './helpers/quote-session-cache/index.js'
import { routePath as checkYourAnswersPath } from './check-your-answers/route-path.js'

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
    const nextPage =
      query.change === 'true' ? checkYourAnswersPath : getNextPage(quoteData)
    return h.redirect(nextPage).code(statusCodes.redirectAfterPost)
  }
})
