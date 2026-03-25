import {
  getValidationFlashFromCache,
  clearValidationFlashFromCache
} from './helpers/form-validation-session/index.js'
import { getQuoteDataFromCache } from './helpers/quote-session-cache/index.js'

export const quoteController = ({ routeId, getViewModel }) => ({
  handler(request, h) {
    const formValidationErrors = getValidationFlashFromCache(request)
    let validationErrors
    let quoteData = getQuoteDataFromCache(request)
    if (formValidationErrors) {
      quoteData = { ...quoteData, ...formValidationErrors.formSubmitData }
      validationErrors = formValidationErrors.validationErrors
      clearValidationFlashFromCache(request)
    }
    const baseViewModel = getViewModel(quoteData)
    const viewModel = {
      ...baseViewModel,
      formSubmitData: quoteData,
      validationErrors
    }
    return h.view(`quote/${routeId}/index`, viewModel)
  }
})
