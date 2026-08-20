import { getFromSessionCache } from './session-cache.js'

export const quoteController = ({ routeId, getViewModel }) => ({
  async handler(request, h) {
    const quoteData = getFromSessionCache(request)
    const baseViewModel = await getViewModel(quoteData)
    const viewModel = {
      ...baseViewModel,
      formSubmitData: quoteData
    }
    return h.view(`request-to-use/${routeId}/index`, viewModel)
  }
})
