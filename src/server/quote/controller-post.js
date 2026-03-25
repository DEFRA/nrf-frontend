import { mapValidationErrorsForDisplay } from '../common/helpers/form-validation.js'
import { saveValidationFlashToCache } from './helpers/form-validation-session/index.js'
import { statusCodes } from '../common/constants/status-codes.js'
import { saveQuoteDataToCache } from './helpers/quote-session-cache/index.js'

export const quotePostController = ({
  formValidation,
  getNextPage,
  payloadOptions
}) => ({
  options: {
    ...(payloadOptions && { payload: payloadOptions }),
    validate: {
      payload: formValidation(),
      failAction: (request, h, err) => {
        const { payload } = request
        const validationErrors = mapValidationErrorsForDisplay(err.details)
        saveValidationFlashToCache(request, {
          validationErrors,
          formSubmitData: payload
        })
        return h
          .redirect(request.path)
          .code(statusCodes.redirectAfterPost)
          .takeover()
      }
    }
  },
  handler(request, h) {
    const { payload } = request
    const quoteData = saveQuoteDataToCache(request, payload)
    const nextPage = getNextPage(quoteData)
    return h.redirect(nextPage).code(statusCodes.redirectAfterPost)
  }
})
