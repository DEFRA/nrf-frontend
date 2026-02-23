import { mapValidationErrorsForDisplay } from '../common/helpers/form-validation.js'
import { saveQuoteDataToCache } from './session-cache.js'

export const quotePostController = ({
  routeId,
  formValidation,
  getViewModel,
  getNextPage
}) => ({
  options: {
    validate: {
      payload: formValidation(),
      failAction: (request, h, err) => {
        const { payload } = request
        const validationErrors = mapValidationErrorsForDisplay(err.details)
        const viewModel = {
          ...getViewModel(),
          formSubmitData: payload,
          validationErrors
        }
        return h.view(`quote/${routeId}/index`, viewModel).takeover()
      }
    }
  },
  handler(request, h) {
    const { payload } = request
    saveQuoteDataToCache(request, payload)
    const nextPage = getNextPage(request.payload)
    return h.redirect(nextPage)
  }
})
