import { getQuoteDataFromCache } from './session-cache.js'

export const quoteController = ({ routeId, getViewModel }) => ({
  handler(request, h) {
    const baseViewModel = getViewModel()
    const quoteData = getQuoteDataFromCache(request)
    const viewModel = { ...baseViewModel, formSubmitData: quoteData }
    return h.view(`quote/${routeId}/index`, viewModel)
  }
})
