import { mapValidationErrorsForDisplay } from '../common/helpers/form-validation.js'
import {
  saveQuoteDataToCache,
  saveValidationFlashToCache
} from './session-cache.js'
import { statusCodes } from '../common/constants/status-codes.js'

export const quotePostController = ({ formValidation, getNextPage }) => ({
  options: {
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
    saveQuoteDataToCache(request, payload)
    const nextPage = getNextPage(request.payload)
    return h.redirect(nextPage).code(statusCodes.redirectAfterPost)
  }
})
