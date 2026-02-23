import {
  getQuoteDataFromCache,
  getValidationFlashFromCache,
  clearValidationFlashFromCache
} from './session-cache.js'

export const quoteController = ({ routeId, getViewModel }) => ({
  handler(request, h) {
    const baseViewModel = getViewModel()
    const formValidationErrors = getValidationFlashFromCache(request)
    let formSubmitData
    let validationErrors
    if (formValidationErrors) {
      formSubmitData = formValidationErrors.formSubmitData
      validationErrors = formValidationErrors.validationErrors
      clearValidationFlashFromCache(request)
    } else {
      formSubmitData = getQuoteDataFromCache(request)
    }
    const viewModel = { ...baseViewModel, formSubmitData, validationErrors }
    return h
      .view(`quote/${routeId}/index`, viewModel)
      .header('Cache-Control', 'no-store, must-revalidate')
  }
})
